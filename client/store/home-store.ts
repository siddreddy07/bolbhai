import { useShopStore } from "@/store/shop-store"
import axios from "axios"
import * as React from "react"
import { toast } from "sonner"
import { create } from "zustand"

import {
  cancelRecording,
  confirmOrder,
  startRecording,
  stopRecording,
  transcribe,
} from "@/lib/stt"
import {
  readStockCache,
  useInventoryStore,
  writeStockCache,
} from "@/store/inventory-store"
import { khataOf, packsFor } from "@/lib/bill"
import {
  createInvoice,
  deleteInvoice,
  fetchAnalytics,
  fetchInvoices,
  updateInvoice,
  type Analytics,
  type StockNow,
} from "@/lib/invoice-api"
import type {
  BillLine,
  Invoice,
  OrderLine,
  Payment,
  PaymentType,
  StockItem,
} from "@/lib/types"

/** Put bills into the list. A bill that is already here stays as it is (it may have an edit waiting to be saved). Newest first. */
function addBills(have: Invoice[], more: Invoice[]) {
  const all = new Map<string, Invoice>()
  for (const b of more) all.set(b.id, b)
  for (const b of have) all.set(b.id, b) // what is already here wins
  return [...all.values()].sort((a, b) => b.date - a.date)
}

export type Phase = "idle" | "listening" | "thinking" | "confirm"
export type SheetKey = "bills" | "stock" | "khata" | null
export type Period = "day" | "week" | "month"

/** The mock bill the voice demo "understands". */

type HomeState = {
  phase: Phase
  /** what the shopkeeper said, written down by the speech-to-text on the server */
  transcript: string
  /** what the order graph found (mapped onto the saved inventory), once the shopkeeper pressed Confirm */
  order: OrderLine[] | null
  /** choose which shelf item a line of the order means */
  pickMatch: (query: string, index: number) => void
  /** Done on the slip: the order is saved on the server as a new bill (not paid yet). Gives its id, or null if it could not be saved. */
  saveOrderAsBill: () => Promise<string | null>
  /** the bill is being created right now */
  savingBill: boolean
  /** how the new bill was paid (chosen on the slip before Done) */
  draftPayment: Payment
  draftPaymentType: PaymentType
  setDraftPayment: (payment: Payment, type: PaymentType) => void
  /** the "Add new bill" slip (a bill made by hand, for when the voice did not work) */
  newBillOpen: boolean
  setNewBillOpen: (open: boolean) => void
  /** Confirm on that slip: saved on the server exactly like a voice bill. Gives its id, or null if it could not be saved. */
  saveNewBill: (
    lines: BillLine[],
    payment: Payment,
    paymentType: PaymentType
  ) => Promise<string | null>
  /** close the slip and forget the order */
  dismiss: () => void
  /** the shop whose bills are loaded */
  billsShopId: string | null
  billsLoading: boolean
  /** a bill change (add, quantity, pay, delete) that could not be saved */
  billError: string | null
  /** every unpaid bill, from any day (the khata page asks for these when it opens). */
  loadBills: (shopId: string, refresh?: boolean) => Promise<void>
  /** ask the server for some bills (one day, or a bill number) and keep them here too, so they can be opened. null if it failed. */
  findBills: (
    shopId: string,
    ask: { day?: string; q?: string }
  ) => Promise<Invoice[] | null>
  /** add one of the shop's products to a bill (+1 if it is already on it) */
  addBillItem: (billId: string, pid: string) => void
  /** change a line's quantity (0 removes it). Saved on the server a moment after the last change. */
  setBillQty: (billId: string, pid: string, quantity: number) => void
  /** paid or in the ledger, and cash or UPI. Saved at once. */
  setBillPayment: (
    billId: string,
    payment: Payment,
    type: PaymentType
  ) => Promise<void>
  removeBill: (billId: string) => Promise<void>
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
  viewInvoice: string | null
  /** the bill whose "delete this bill?" question is open. While it is open the bill cannot be changed or closed, whatever the screen shows. */
  deleteAsk: string | null
  setDeleteAsk: (id: string | null) => void
  period: Period
  /** sales for today, this week and this month: ONE request, kept here, so switching the tabs asks nothing */
  analytics: Analytics | null
  analyticsShopId: string | null
  loadAnalytics: (shopId: string) => Promise<void>
  invoices: Invoice[]
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
  setSheet: (s: SheetKey) => void
  setViewInvoice: (id: string | null) => void
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
  deleteAsk: null,
  newBillOpen: false,
  period: "day",
  analytics: null,
  analyticsShopId: null,
  invoices: [],
  billsShopId: null,
  billsLoading: false,
  billError: null,
  savingBill: false,
  draftPayment: "LEDGER", // every new bill starts as not paid
  draftPaymentType: "CASH",
  setDraftPayment: (draftPayment, draftPaymentType) =>
    set({ draftPayment, draftPaymentType }),
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
  setSheet: (sheet) => set({ sheet }),
  setNewBillOpen: (newBillOpen) => set({ newBillOpen }),
  saveNewBill: async (lines, payment, paymentType) => {
    const shopId = useShopStore.getState().shop?.id
    if (!shopId || !lines.length || get().savingBill) return null
    set({ savingBill: true })
    try {
      await syncStock() // counts pressed by hand go first
      const { invoice: bill, stock } = await createInvoice(
        shopId,
        lines,
        payment,
        paymentType
      )
      applyStock(stock) // the shelf already moved on the server
      analyticsStale = true
      set((s) => ({
        invoices: [bill, ...s.invoices],
        billsShopId: s.billsShopId ?? shopId,
        newBillOpen: false,
      }))
      const count = bill.items.reduce((n, l) => n + l.quantity, 0)
      toast.success("Bill saved", {
        description: `${count} ${count === 1 ? "item" : "items"} added to Bills`,
        action: {
          label: "Open",
          onClick: () => get().setViewInvoice(bill.id),
        },
      })
      return bill.id
    } catch {
      toast.error("Could not save the bill", {
        description:
          "Nothing was changed. Check your connection and try again.",
      })
      return null
    } finally {
      set({ savingBill: false })
    }
  },
  setDeleteAsk: (deleteAsk) => set({ deleteAsk }),
  setViewInvoice: (viewInvoice) => {
    if (get().deleteAsk) return // answer the question first
    set({ viewInvoice })
  },
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
      const found = await confirmOrder(shopId, transcript)
      // the graph only sends ids: everything else comes from the saved inventory
      if (get().stockShopId !== shopId || !get().stock.length)
        await get().loadStock(shopId)
      const byId = new Map(get().stock.map((i) => [i.id, i]))
      const byProduct = new Map(
        get()
          .stock.filter((i) => i.productId)
          .map((i) => [i.productId!, i])
      )
      set({
        order: found.map((f) => ({
          query: f.query,
          quantity: f.quantity,
          unit: f.unit,
          pick: 0,
          matches: f.options
            .map(
              (o) =>
                byId.get(o.id) ??
                (o.productId ? byProduct.get(o.productId) : undefined)
            )
            .filter((i): i is StockItem => !!i),
        })),
      })
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
  dismiss: () => {
    clearTimeout(timer)
    cancelRecording()
    set({
      phase: "idle",
      order: null,
      orderError: null,
      transcript: "",
      draftPayment: "LEDGER",
      draftPaymentType: "CASH",
    })
  },
  pickMatch: (query, index) =>
    set((s) => ({
      order:
        s.order?.map((l) => (l.query === query ? { ...l, pick: index } : l)) ??
        null,
    })),
  saveOrderAsBill: async () => {
    const { order, savingBill, draftPayment, draftPaymentType } = get()
    const shopId = useShopStore.getState().shop?.id
    if (!order || !shopId || savingBill) return null
    // one line per product (the same product asked twice adds up). A shop's own item has no product id, so it cannot be on a bill yet.
    const lines = new Map<string, number>()
    for (const l of order) {
      const item = l.matches[l.pick]
      if (!item?.productId) continue
      lines.set(
        item.productId,
        (lines.get(item.productId) ?? 0) +
          packsFor(l.quantity, l.unit, item.size)
      )
    }
    if (!lines.size) {
      set({ orderError: "Nothing here can go on a bill yet" })
      return null
    }
    set({ savingBill: true, orderError: null })
    try {
      await syncStock() // counts pressed by hand go first, so the server's numbers below are the whole truth
      const { invoice: bill, stock } = await createInvoice(
        shopId,
        [...lines].map(([pid, quantity]) => ({ pid, quantity })),
        draftPayment,
        draftPaymentType
      )
      applyStock(stock) // the shelf already moved on the server
      analyticsStale = true
      set((s) => ({
        invoices: [bill, ...s.invoices],
        billsShopId: s.billsShopId ?? shopId,
        phase: "idle",
        order: null,
        transcript: "",
        draftPayment: "LEDGER",
        draftPaymentType: "CASH",
      }))
      const count = bill.items.reduce((n, l) => n + l.quantity, 0)
      toast.success("Bill saved", {
        description: `${count} ${count === 1 ? "item" : "items"} added to Bills`,
        action: {
          label: "Open",
          onClick: () => get().setViewInvoice(bill.id),
        },
      })
      return bill.id
    } catch {
      toast.error("Could not save the bill", {
        description:
          "Nothing was changed. Check your connection and try again.",
      })
      set({ orderError: "Could not save the bill. Try again" })
      return null
    } finally {
      set({ savingBill: false })
    }
  },
  loadBills: async (shopId, refresh = false) => {
    if (!refresh && get().billsShopId === shopId) return
    if (get().billsShopId !== shopId) set({ billsShopId: shopId, invoices: [] })
    set({ billsLoading: true })
    try {
      const unpaid = await fetchInvoices(shopId, { unpaid: true })
      if (get().billsShopId === shopId)
        set((s) => ({
          invoices: addBills(s.invoices, unpaid),
          billError: null,
        }))
    } catch {
      if (get().billsShopId === shopId)
        set({ billError: "Could not load the bills" })
    } finally {
      if (get().billsShopId === shopId) set({ billsLoading: false })
    }
  },
  findBills: async (shopId, ask) => {
    try {
      const bills = await fetchInvoices(shopId, ask)
      if (get().billsShopId === shopId)
        set((s) => ({ invoices: addBills(s.invoices, bills) }))
      return bills
    } catch {
      return null
    }
  },
  loadAnalytics: async (shopId) => {
    if (get().analyticsShopId !== shopId)
      set({ analyticsShopId: shopId, analytics: null })
    if (get().billsShopId !== shopId) set({ billsShopId: shopId, invoices: [] })
    try {
      const { analytics, bills } = await fetchAnalytics(shopId)
      // the graphs, and today's bills for the lists, from the same answer
      if (get().analyticsShopId === shopId)
        set((s) => ({ analytics, invoices: addBills(s.invoices, bills) }))
    } catch {
      // the chart keeps what it had (or stays empty); the next bill change tries again
    }
  },
  addBillItem: (billId, pid) => {
    if (get().deleteAsk) return
    if (!get().invoices.some((b) => b.id === billId)) return
    if (!moveShelf(pid, 1)) return // none left on the shelf
    set((s) => ({
      invoices: s.invoices.map((b) => {
        if (b.id !== billId) return b
        const has = b.items.some((l) => l.pid === pid)
        return {
          ...b,
          items: has
            ? b.items.map((l) =>
                l.pid === pid ? { ...l, quantity: l.quantity + 1 } : l
              )
            : [...b.items, { pid, quantity: 1 }],
        }
      }),
    }))
    scheduleBillSave(billId)
  },
  setBillQty: (billId, pid, quantity) => {
    if (get().deleteAsk) return
    const line = get()
      .invoices.find((b) => b.id === billId)
      ?.items.find((l) => l.pid === pid)
    if (!moveShelf(pid, quantity - (line?.quantity ?? 0))) return // not enough on the shelf
    set((s) => ({
      invoices: s.invoices.map((b) => {
        if (b.id !== billId) return b
        return {
          ...b,
          items:
            quantity > 0
              ? b.items.map((l) => (l.pid === pid ? { ...l, quantity } : l))
              : b.items.filter((l) => l.pid !== pid),
        }
      }),
    }))
    scheduleBillSave(billId)
  },
  setBillPayment: async (billId, payment, paymentType) => {
    if (get().deleteAsk) return
    const before = get().invoices.find((b) => b.id === billId)
    if (!before) return
    set((s) => ({
      invoices: s.invoices.map((b) =>
        b.id === billId ? { ...b, payment, paymentType } : b
      ),
    }))
    try {
      await updateInvoice(billId, { payment, paymentType }) // does not touch the stock
      set({ billError: null })
    } catch {
      // not saved: put it back
      set((s) => ({
        invoices: s.invoices.map((b) =>
          b.id === billId
            ? { ...b, payment: before.payment, paymentType: before.paymentType }
            : b
        ),
        billError: "Could not change the payment. Try again",
      }))
      toast.error("Could not change the payment", {
        description: "It was put back as it was.",
      })
    }
  },
  removeBill: async (billId) => {
    if (get().deleteAsk !== billId) return // only after the question was asked
    clearTimeout(billTimers.get(billId))
    billTimers.delete(billId)
    try {
      await syncStock()
      applyStock(await deleteInvoice(billId)) // its items are back on the shelf, on the server
      analyticsStale = true
      toast.success("Bill deleted", {
        description: "Its items are back on your shelf.",
      })
      set((s) => ({
        invoices: s.invoices.filter((b) => b.id !== billId),
        viewInvoice: s.viewInvoice === billId ? null : s.viewInvoice,
        deleteAsk: null,
        billError: null,
      }))
    } catch {
      set({
        deleteAsk: null,
        billError: "Could not delete the bill. Try again",
      })
      toast.error("Could not delete the bill", {
        description: "It is still in your bills.",
      })
    }
  },
}))

// ---- bills and the shelf: the SERVER moves the stock with every bill change (in the same statement) and sends the new counts back ----

/**
 * A bill made, edited or deleted changes the sales, but the graphs are not on screen then, so they are not fetched at once:
 * they are only marked out of date, and the dashboard fetches them when it is looked at (`refreshIfStale`).
 */
let analyticsStale = false
export function refreshIfStale() {
  if (!analyticsStale) return
  analyticsStale = false
  const { billsShopId, loadAnalytics } = useHomeStore.getState()
  if (billsShopId) void loadAnalytics(billsShopId)
}

/**
 * A bill takes `take` of a product off the shelf (a negative number gives some back).
 * The shelf number changes AT ONCE, here in the app (it is not marked as changed: the server moves the shelf itself when the bill is saved).
 * Asking for more than is left changes nothing and says so. Gives true when the change is fine.
 */
function moveShelf(pid: string, take: number) {
  if (take === 0) return true
  const item = useHomeStore.getState().stock.find((i) => i.productId === pid)
  if (!item) return true // not a shelf product: nothing to count
  if (take > item.qty) {
    toast.error(
      item.qty === 0
        ? `${item.name} is out of stock`
        : `Only ${item.qty} ${item.name} left`,
      { description: "Add more to the stock first." }
    )
    return false
  }
  useHomeStore.setState((s) => ({
    stock: s.stock.map((i) =>
      i.productId === pid ? { ...i, qty: i.qty - take } : i
    ),
  }))
  return true
}

/** Puts the server's stock counts (by product id) into the saved inventory. Not marked as changed here: the server already has them. */
function applyStock(rows: StockNow) {
  if (!rows.length) return
  const now = new Map(rows.map((r) => [r.productId, Math.max(0, r.stock)]))
  useHomeStore.setState((s) => ({
    stock: s.stock.map((i) =>
      i.productId && now.has(i.productId)
        ? { ...i, qty: now.get(i.productId)! }
        : i
    ),
  }))
}

// ---- saving a bill after +, - or an added product: one call, a moment after the last change ----
const BILL_SAVE_AFTER = 600
const billTimers = new Map<string, ReturnType<typeof setTimeout>>()

function scheduleBillSave(billId: string) {
  clearTimeout(billTimers.get(billId))
  billTimers.set(
    billId,
    setTimeout(() => void flushBill(billId), BILL_SAVE_AFTER)
  )
}

/** Sends a bill's items now (if a change is waiting). Called when the bill drawer closes. */
export async function flushBill(billId: string) {
  if (!billTimers.has(billId)) return
  clearTimeout(billTimers.get(billId))
  billTimers.delete(billId)
  const bill = useHomeStore.getState().invoices.find((b) => b.id === billId)
  if (!bill) return
  // a bill must keep at least one line: with none left, the shopkeeper deletes the bill instead
  if (!bill.items.length) return
  try {
    await syncStock()
    const { stock } = await updateInvoice(billId, { items: bill.items })
    applyStock(stock)
    useHomeStore.setState({ billError: null })
    analyticsStale = true // the graphs are fetched again when the dashboard is looked at
  } catch (error) {
    // the server said "not enough on the shelf": show its shelf numbers, nothing was saved
    const reply = (
      error as {
        response?: {
          status?: number
          data?: { message?: string; stock?: StockNow }
        }
      }
    ).response
    if (reply?.status === 409) {
      applyStock(reply.data?.stock ?? [])
      useHomeStore.setState({ billError: reply.data?.message ?? null })
      toast.error(reply.data?.message ?? "Not enough in stock", {
        description: "The bill was not changed on the server.",
      })
      return
    }
    useHomeStore.setState({ billError: "Could not save the change. Try again" })
    toast.error("Could not save the change", {
      description: "Your last edit to the bill was not saved.",
    })
  }
}

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

/** The khata (unpaid bills, how many, how much): worked out from the bills and the saved inventory in this store. No request. */
export function useKhata() {
  const invoices = useHomeStore((s) => s.invoices)
  const stock = useHomeStore((s) => s.stock)
  return React.useMemo(() => khataOf(invoices, stock), [invoices, stock])
}
