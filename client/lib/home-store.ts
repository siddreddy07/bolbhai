import axios from "axios"
import { create } from "zustand"

import { cancelRecording, confirmOrder, startRecording, stopRecording, transcribe, type OrderItem } from "@/lib/stt"
import { loadShopStock, saveShopStock } from "@/lib/shop-stock"
import { makeCustomers, makeInvoices, type Customer, type Invoice, type StockItem } from "@/lib/mock-data"

export type Phase = "idle" | "listening" | "thinking" | "confirm" | "done"
export type SheetKey = "bills" | "stock" | "khata" | null
export type Period = "day" | "week" | "month"

/** The mock bill the voice demo "understands". */
export const DRAFT = { who: "Ramesh", line: "Rice 25 kg × 5", amount: 6200 }

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
  /** the shop whose stock is loaded (stock lives in localStorage, per shop) */
  stockShopId: string | null
  loadStock: (shopId: string) => void
  /** stock came in by hand (no voice needed) */
  addStock: (id: string, qty: number) => void
  /** stock manager: type it, or snap a photo, both end up here */
  adjust: (id: string, delta: number) => void
  saveItem: (item: Omit<StockItem, "added" | "id"> & { id?: string }) => string
  removeItem: (id: string) => void
  /** someone paid their khata by hand (no voice needed) */
  payDue: (id: string, amount: number) => void
  setSheet: (s: SheetKey) => void
  setViewInvoice: (id: number | null) => void
  setPeriod: (p: Period) => void
  /** idle -> listening -> thinking -> confirm */
  tapMic: () => void
  confirm: () => void
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
  setTranscript: (transcript) => set({ transcript, order: null, orderError: null }),
  micError: null,
  sheet: null,
  viewInvoice: null,
  period: "day",
  sales: 18450,
  bills: 23,
  invoices: makeInvoices(),
  customers: makeCustomers(),
  stock: [],
  stockShopId: null,
  loadStock: (shopId) => set({ stockShopId: shopId, stock: loadShopStock(shopId) }),
  adjust: (id, delta) => set((s) => ({ stock: s.stock.map((i) => (i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i)) })),
  saveItem: (item) => {
    const id = item.id ?? `n${Date.now()}`
    set((s) => {
      const exists = s.stock.some((i) => i.id === id)
      if (exists) return { stock: s.stock.map((i) => (i.id === id ? { ...i, ...item, id } : i)) }
      const added = Math.max(0, ...s.stock.map((i) => i.added)) + 1
      return { stock: [{ ...item, id, added }, ...s.stock] }
    })
    return id
  },
  removeItem: (id) => set((s) => ({ stock: s.stock.filter((i) => i.id !== id) })),
  addStock: (id, qty) => set((s) => ({ stock: s.stock.map((i) => (i.id === id ? { ...i, qty: i.qty + qty } : i)) })),
  payDue: (id, amount) =>
    set((s) => ({
      customers: s.customers.map((c) => (c.id === id ? { ...c, due: Math.max(0, c.due - amount) } : c)),
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
        set({ phase: "idle", micError: error instanceof Error && error.message === "I did not hear anything" ? error.message : "Could not hear that. Try again" })
      }
      return
    }

    if (phase !== "idle") return
    set({ micError: null, transcript: "", order: null, orderError: null, caption: "" })
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
    set({ finding: true, orderError: null })
    try {
      set({ order: await confirmOrder(transcript) })
    } catch (error) {
      const aiDown = axios.isAxiosError(error) && error.response?.status === 503
      set({ orderError: aiDown ? "The AI is not available right now" : "Could not find the items. Try again" })
    } finally {
      set({ finding: false })
    }
  },
  confirm: () => {
    set((s) => ({
      phase: "done",
      sales: s.sales + DRAFT.amount,
      bills: s.bills + 1,
      invoices: [{ id: (s.invoices[0]?.id ?? 1042) + 1, who: DRAFT.who, amount: DRAFT.amount, status: "Paid", daysAgo: 0 }, ...s.invoices],
    }))
    later(() => set({ phase: "idle" }), 2600)
  },
  cancel: () => {
    clearTimeout(timer)
    cancelRecording()
    set({ phase: "idle" })
  },
}))

// Every stock change is saved for the shop that is on screen.
useHomeStore.subscribe((state, prev) => {
  if (state.stockShopId && state.stockShopId === prev.stockShopId && state.stock !== prev.stock) saveShopStock(state.stockShopId, state.stock)
})
