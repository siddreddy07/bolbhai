import { create } from "zustand"

import { makeCustomers, makeInvoices, makeStock, type Customer, type Invoice, type StockItem } from "@/lib/mock-data"

export type Phase = "idle" | "listening" | "thinking" | "confirm" | "done"
export type SheetKey = "bills" | "stock" | "khata" | null
export type Period = "day" | "week" | "month"

/** The mock bill the voice demo "understands". */
export const DRAFT = { who: "Ramesh", line: "Rice 25 kg × 5", amount: 6200 }

type HomeState = {
  phase: Phase
  sheet: SheetKey
  /** the bill whose invoice is open (any screen) */
  viewInvoice: number | null
  period: Period
  sales: number
  bills: number
  invoices: Invoice[]
  customers: Customer[]
  stock: StockItem[]
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
  sheet: null,
  viewInvoice: null,
  period: "day",
  sales: 18450,
  bills: 23,
  invoices: makeInvoices(),
  customers: makeCustomers(),
  stock: makeStock(),
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
  tapMic: () => {
    const { phase } = get()
    if (phase === "listening") {
      // second tap = "I'm done talking"
      set({ phase: "thinking" })
      later(() => set({ phase: "confirm" }), 900)
      return
    }
    if (phase !== "idle") return
    set({ phase: "listening" })
    // no second tap needed: it stops listening by itself
    later(() => {
      set({ phase: "thinking" })
      later(() => set({ phase: "confirm" }), 900)
    }, 2600)
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
    set({ phase: "idle" })
  },
}))
