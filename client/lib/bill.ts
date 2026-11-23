import type { BillLine, Invoice, StockItem } from "@/lib/types"

const TO_BASE: Record<string, { kind: "weight" | "liquid"; k: number }> = {
  g: { kind: "weight", k: 1 },
  kg: { kind: "weight", k: 1000 },
  ml: { kind: "liquid", k: 1 },
  l: { kind: "liquid", k: 1000 },
}

function base(amount: number, unit: string | null | undefined) {
  const u = TO_BASE[(unit ?? "").toLowerCase()]
  return u ? { kind: u.kind, value: amount * u.k } : null
}

/** "500g", "1kg", "2l" -> the amount in g or ml. A plain count or nothing -> null. */
function packBase(size: string | null | undefined) {
  const m = /^(\d+(?:\.\d+)?)\s*(kg|g|ml|l)$/i.exec((size ?? "").trim())
  return m ? base(Number(m[1]), m[2]) : null
}

/** How many packs of this item were asked for: "2 kg" of a 500g pack = 4 packs; "3" of anything = 3. */
export function packsFor(
  quantity: number | null,
  unit: string | null,
  size: string | null | undefined
) {
  if (!quantity || quantity <= 0) return 1
  const wanted = base(quantity, unit)
  const pack = packBase(size)
  if (wanted && pack && wanted.kind === pack.kind)
    return Math.max(1, Math.round(wanted.value / pack.value))
  return Math.max(1, Math.round(quantity))
}

/** Whole days between the day a bill was made and today (0 = today). */
export function daysAgo(date: number) {
  const day = (t: number) => new Date(t).setHours(0, 0, 0, 0)
  return Math.max(0, Math.round((day(Date.now()) - day(date)) / 864e5))
}

// ---- a bill only keeps { pid, quantity }; the name, pack and price come from the saved inventory ----

export const isPaid = (inv: Invoice) => inv.payment === "PAID"

/** Items can change only while the bill is unpaid and under 24 hours old (the server checks it too). */
export const isLocked = (inv: Invoice) =>
  isPaid(inv) || Date.now() - inv.date >= 24 * 60 * 60 * 1000

/** A short bill number to show, from its id. */
export const billNumber = (inv: { id: string }) => inv.id.slice(0, 4).toUpperCase()

type LineInfo = {
  pid: string
  quantity: number
  name: string
  size: string | null
  price: number
}

/** A bill line with its name, pack and price (a product that left the shelf shows as "Removed item"). */
export function lineInfo(line: BillLine, stock: StockItem[]): LineInfo {
  const item = stock.find((i) => i.productId === line.pid)
  return {
    pid: line.pid,
    quantity: line.quantity,
    name: item?.name ?? "Removed item",
    size: item?.size ?? null,
    price: item?.price ?? 0,
  }
}

export const invoiceTotal = (inv: Invoice, stock: StockItem[]) =>
  inv.items.reduce((sum, l) => sum + l.quantity * lineInfo(l, stock).price, 0)

/** One unpaid bill as the khata shows it. */
export type KhataBill = {
  id: string
  date: number
  itemCount: number
  total: number
  items: LineInfo[]
}

/**
 * The khata is NOT fetched: it is every bill that is not paid, worked out from the bills the page already loaded
 * (and the saved inventory for names and prices). Newest first. So marking a bill paid or not paid changes it on the spot,
 * with no request of its own.
 */
export function khataOf(invoices: Invoice[], stock: StockItem[]) {
  const bills: KhataBill[] = invoices
    .filter((i) => !isPaid(i))
    .map((i) => ({
      id: i.id,
      date: i.date,
      itemCount: i.items.reduce((n, l) => n + l.quantity, 0),
      total: invoiceTotal(i, stock),
      items: i.items.map((l) => lineInfo(l, stock)),
    }))
    .sort((a, b) => b.date - a.date)
  return {
    bills,
    count: bills.length,
    totalDue: bills.reduce((n, b) => n + b.total, 0),
  }
}
