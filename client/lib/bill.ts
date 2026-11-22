import type { BillLine, Invoice } from "@/lib/types"

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

export const billTotal = (items: BillLine[]) =>
  items.reduce((sum, l) => sum + l.qty * l.price, 0)

/** Whole days between the day the bill was made and today (0 = today). */
export function daysAgo(createdAt: number) {
  const day = (t: number) => new Date(t).setHours(0, 0, 0, 0)
  return Math.max(0, Math.round((day(Date.now()) - day(createdAt)) / 864e5))
}

// ---- bills are kept in localStorage, one list per shop ----
const billsKey = (shopId: string) => `bolbhai:bills:${shopId}`

export function readBills(shopId: string): Invoice[] {
  try {
    const saved = JSON.parse(localStorage.getItem(billsKey(shopId)) ?? "[]")
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

export function writeBills(shopId: string, bills: Invoice[]) {
  try {
    localStorage.setItem(billsKey(shopId), JSON.stringify(bills))
  } catch {
    // storage full or blocked: the bills still work for this visit
  }
}
