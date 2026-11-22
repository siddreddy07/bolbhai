import { useShopStore } from "@/store/shop-store"
import axios from "axios"
import { create } from "zustand"

import {
  cancelRecording,
  confirmOrder,
  startRecording,
  stopRecording,
  transcribe,
  type OrderItem,
} from "@/lib/stt"
import {
  readStockCache,
  useInventoryStore,
  writeStockCache,
} from "@/store/inventory-store"
import type { Customer, Invoice, StockItem } from "@/lib/types"

export type Phase = "idle" | "listening" | "thinking" | "confirm"
export type SheetKey = "bills" | "stock" | "khata" | null
export type Period = "day" | "week" | "month"

/** The mock bill the voice demo "understands". */

type HomeState = {
  phase: Phase
  /** what the shopkeeper said, written down by the speech-to-text on the server */
  transcript: string
  /** the items the order graph found, once the shopkeeper pressed Confirm */
  order: OrderItem[] | null
  /** Confirm was pressed and the graph is still working */
  finding: boolean
  orderError: string | null
  /** Confirm: the text on the slip goes to the order graph */
  findItems: () => Promise<void>
  /** live captions while the shopkeeper is still talking */
  caption: string
  /** the shopkeeper fixes the text, or types it instead of saying it */
  setTranscript: (text: string) => void
  /** why the mic could not work (no permission, server down...) */
  micError: string | null
  sheet: SheetKey
  /** the bill whose invoice is open (any screen) */
  viewInvoice: number | null
  period: Period
  sales: number
  bills: number
  invoices: Invoice[]
  customers: Customer[]
  stock: StockItem[]
  /** the shop whose stock is loaded */
  stockShopId: string | null
  stockLoading: boolean
  /** when this shop's counts were last saved on the server (ms) */
  stockSyncedAt: number
  /** the products whose count changed since then. Only these are sent; once saved they leave this list. */
  dirtyIds: string[]
  /** Opens a shop's stock. It comes from localStorage if it is there; refresh = true asks the server again. */
  loadStock: (shopId: string, refresh?: boolean) => Promise<void>
  /** stock came in by hand (no voice needed) */
  addStock: (id: string, qty: number) => void
  /** stock manager: type it, or snap a photo, both end up here */
  adjust: (id: string, delta: number) => void
  /** an exact count, typed in the box between - and + */
  setQty: (id: string, qty: number) => void
  saveItem: (item: Omit<StockItem, "added" | "id"> & { id?: string }) => string
  /** the product being deleted right now (everything else is locked until it is done) */
  deletingId: string | null
  removeItem: (id: string) => Promise<void>
  /** someone paid their khata by hand (no voice needed) */
  payDue: (id: string, amount: number) => void
  setSheet: (s: SheetKey) => void
  setViewInvoice: (id: number | null) => void
  setPeriod: (p: Period) => void
  /** idle -> listening -> thinking -> confirm */
  tapMic: () => void
  cancel: () => void
}

let timer: ReturnType<typeof setTimeout> | undefined
const later = (fn: () => void, ms: number) => {
  clearTimeout(timer)
  timer = setTimeout(fn, ms)
}

export const useHomeStore = create<HomeState>((set, get) => ({
  phase: "idle",
  transcript: "",
  order: null,
  finding: false,
  orderError: null,
  caption: "",
  // typing changes the text, so the items found for the old text no longer apply
  setTranscript: (transcript) =>
    set({ transcript, order: null, orderError: null }),
  micError: null,
  sheet: null,
  viewInvoice: null,
  period: "day",
  sales: 0,
  bills: 0,
  invoices: [],
  customers: [],
  stock: [],
  stockShopId: null,
  stockLoading: false,
  stockSyncedAt: 0,
  dirtyIds: [],
  deletingId: null,
  // the stock page: the saved copy if there is one, else ask the server for everything this shop sells
  loadStock: async (shopId, refresh = false) => {
    if (get().stockShopId && get().stockShopId !== shopId) void syncStock() // leaving a shop: save its counts first
    const saved = readStockCache(shopId)
    if (saved && !refresh) {
      set({
        stockShopId: shopId,
        stock: saved.stock,
        stockSyncedAt: saved.syncedAt,
        dirtyIds: saved.dirtyIds,
        stockLoading: false,
      }) // no route hit
      void syncStock() // counts changed before the page was closed are saved now
      return
    }
    set({
      stockShopId: shopId,
      stock: refresh && saved ? saved.stock : [],
      stockSyncedAt: saved?.syncedAt ?? Date.now(),
      dirtyIds: saved?.dirtyIds ?? [],
      stockLoading: true,
    })
    try {
      const fresh = await useInventoryStore.getState().fetchStock(shopId)
      // counts in dirtyIds were changed here and are not saved yet, so they win over the server's
      const mine = new Map(
        (saved?.stock ?? [])
          .filter((i) => saved!.dirtyIds.includes(i.id))
          .map((i) => [i.id, i.qty])
      )
      const stock = fresh.map((i) =>
        mine.has(i.id) ? { ...i, qty: mine.get(i.id)! } : i
      )
      if (get().stockShopId === shopId)
        set({
          stock,
          dirtyIds: (saved?.dirtyIds ?? []).filter((id) =>
            stock.some((i) => i.id === id)
          ),
        }) // ignore it if the shopkeeper switched shops meanwhile
    } catch {
      // the page just shows no products
    } finally {
      if (get().stockShopId === shopId) set({ stockLoading: false })
    }
  },
  // + / -: saved in localStorage at once (see the subscribe below); everything changed is sent in ONE call 10 seconds after the last press
  adjust: (id, delta) => {
    set((s) => ({
      stock: s.stock.map((i) =>
        i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i
      ),
      dirtyIds: s.dirtyIds.includes(id) ? s.dirtyIds : [...s.dirtyIds, id], // this one has to be saved
    }))
    scheduleSync()
  },
  setQty: (id, qty) => {
    const count = Math.max(0, Math.min(99999, Math.floor(qty) || 0))
    set((s) => ({
      stock: s.stock.map((i) => (i.id === id ? { ...i, qty: count } : i)),
      dirtyIds: s.dirtyIds.includes(id) ? s.dirtyIds : [...s.dirtyIds, id],
    }))
    scheduleSync()
  },
  saveItem: (item) => {
    const id = item.id ?? `n${Date.now()}`
    set((s) => {
      const old = s.stock.find((i) => i.id === id)
      if (old) {
        return {
          stock: s.stock.map((i) => (i.id === id ? { ...i, ...item, id } : i)),
          // an edited count is saved like a + / - one
          dirtyIds:
            item.qty !== old.qty && !s.dirtyIds.includes(id)
              ? [...s.dirtyIds, id]
              : s.dirtyIds,
        }
      }
      const added = Math.max(0, ...s.stock.map((i) => i.added)) + 1
      return { stock: [{ ...item, id, added }, ...s.stock] }
    })
    scheduleSync()
    return id
  },
  // Locks the page, asks the server, and only when it said yes does the product leave the list.
  removeItem: async (id) => {
    const shopId = get().stockShopId
    if (get().deletingId) return
    if (!shopId || !IS_ID.test(id)) {
      set((s) => ({ stock: s.stock.filter((i) => i.id !== id) })) // only ever on this screen: nothing to ask
      return
    }
    set({ deletingId: id })
    try {
      await useInventoryStore.getState().removeProduct(shopId, id)
      set((s) => ({
        stock: s.stock.filter((i) => i.id !== id),
        dirtyIds: s.dirtyIds.filter((d) => d !== id),
      }))
    } catch {
      // not deleted: the product stays in the list
    } finally {
      set({ deletingId: null })
    }
  },
  addStock: (id, qty) =>
    set((s) => ({
      stock: s.stock.map((i) => (i.id === id ? { ...i, qty: i.qty + qty } : i)),
    })),
  payDue: (id, amount) =>
    set((s) => ({
      customers: s.customers.map((c) =>
        c.id === id ? { ...c, due: Math.max(0, c.due - amount) } : c
      ),
    })),
  setSheet: (sheet) => set({ sheet }),
  setViewInvoice: (viewInvoice) => set({ viewInvoice }),
  setPeriod: (period) => set({ period }),
  tapMic: async () => {
    const { phase } = get()

    // second tap (or the 20 second limit) = "I'm done talking": send the recording to the server
    if (phase === "listening") {
      clearTimeout(timer)
      set({ phase: "thinking" })
      try {
        const text = await transcribe(await stopRecording())
        if (!text) throw new Error("I did not hear anything")
        set({ phase: "confirm", transcript: text })
      } catch (error) {
        set({
          phase: "idle",
          micError:
            error instanceof Error &&
            error.message === "I did not hear anything"
              ? error.message
              : "Could not hear that. Try again",
        })
      }
      return
    }

    if (phase !== "idle") return
    set({
      micError: null,
      transcript: "",
      order: null,
      orderError: null,
      caption: "",
    })
    try {
      await startRecording(
        (caption) => set({ caption }),
        (why) => set({ micError: why })
      )
    } catch {
      set({ micError: "Allow the microphone to talk" })
      return
    }
    set({ phase: "listening" })
    later(() => get().tapMic(), 20000) // never record forever
  },
  findItems: async () => {
    const { transcript, finding } = get()
    if (finding || !transcript.trim()) return
    const shopId = useShopStore.getState().shop?.id
    if (!shopId) return set({ orderError: "Pick a shop first" })
    set({ finding: true, orderError: null })
    try {
      set({ order: await confirmOrder(shopId, transcript) })
    } catch (error) {
      const aiDown = axios.isAxiosError(error) && error.response?.status === 503
      set({
        orderError: aiDown
          ? "The AI is not available right now"
          : "Could not find the items. Try again",
      })
    } finally {
      set({ finding: false })
    }
  },
  cancel: () => {
    clearTimeout(timer)
    cancelRecording()
    set({ phase: "idle" })
  },
}))

// ---- saving the + / - counts on the server ----
const IS_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SYNC_AFTER = 10_000 // ten seconds after the LAST press of any product
let syncTimer: ReturnType<typeof setTimeout> | undefined
let sending = false

/** Every press starts the 10 second wait again, so a burst of presses ends in one call. */
function scheduleSync() {
  clearTimeout(syncTimer)
  syncTimer = setTimeout(() => void syncStock(), SYNC_AFTER)
}

/** Sends the products in dirtyIds in one call (each with its latest count), then empties the list and moves the saved-at time. */
export async function syncStock() {
  clearTimeout(syncTimer)
  const { stockShopId: shopId, stock, dirtyIds } = useHomeStore.getState()
  if (!shopId || sending) return
  const sent = stock.filter((i) => dirtyIds.includes(i.id) && IS_ID.test(i.id))
  if (!sent.length) return

  const startedAt = Date.now()
  sending = true
  try {
    await useInventoryStore.getState().saveStock(
      shopId,
      sent.map((i) => ({ id: i.id, stock: i.qty }))
    )
    if (useHomeStore.getState().stockShopId === shopId) {
      useHomeStore.setState((s) => ({
        stockSyncedAt: startedAt,
        // a product pressed again while we were sending has a new count: it stays in the list
        dirtyIds: s.dirtyIds.filter((id) => {
          const was = sent.find((i) => i.id === id)
          return !was || s.stock.find((i) => i.id === id)?.qty !== was.qty
        }),
      }))
    }
  } catch {
    // not saved: the ids stay in dirtyIds, so the next save (or leaving the page) sends them
  } finally {
    sending = false
  }
}

// Every stock change (+ / -, add, delete) is saved for the shop that is on screen.
useHomeStore.subscribe((state, prev) => {
  if (
    state.stockShopId &&
    state.stockShopId === prev.stockShopId &&
    (state.stock !== prev.stock ||
      state.stockSyncedAt !== prev.stockSyncedAt ||
      state.dirtyIds !== prev.dirtyIds)
  )
    writeStockCache(state.stockShopId, {
      stock: state.stock,
      syncedAt: state.stockSyncedAt,
      dirtyIds: state.dirtyIds,
    })
})
