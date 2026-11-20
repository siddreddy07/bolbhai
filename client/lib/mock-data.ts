// Mock data, swapped for the API layer later.

export type Invoice = { id: number; who: string; amount: number; status: "Paid" | "Khata"; daysAgo: number }
export type Customer = { id: string; name: string; due: number; days: number }
export type CatId = "grains" | "pulses" | "oils" | "sugar" | "spices" | "tea" | "snacks" | "home"
export type StockItem = {
  id: string
  name: string
  category: CatId
  unit: string
  qty: number
  /** what a full shelf looks like (drives the low-stock alert) */
  max: number
  price: number
  /** bigger = added more recently */
  added: number
}

const NAMES = ["Ramesh", "Lakshmi Stores", "Walk-in", "Anil Kirana", "Sita Devi", "Mohan", "Kiran Traders", "Walk-in", "Pooja", "Walk-in"]

/** Deterministic pseudo-random so server and client agree. */
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

export function makeInvoices(): Invoice[] {
  const out: Invoice[] = []
  let id = 1042
  for (let day = 0; day < 365; day++) {
    const n = day === 0 ? 6 : 1 + Math.floor(rand(day) * 3)
    for (let k = 0; k < n; k++) {
      const r = rand(day * 7 + k + 1)
      out.push({
        id: id--,
        who: NAMES[Math.floor(rand(day * 13 + k) * NAMES.length)],
        amount: Math.round((120 + r * 8800) / 10) * 10,
        status: rand(day * 5 + k + 3) > 0.7 ? "Khata" : "Paid",
        daysAgo: day,
      })
    }
  }
  return out
}

const FIRST = ["Ramesh", "Lakshmi", "Anil", "Sita", "Mohan", "Kiran", "Pooja", "Suresh", "Vijay", "Geeta", "Ravi", "Anita", "Prakash", "Latha", "Venkat", "Meena"]
const SECOND = ["Stores", "Kirana", "Traders", "General", "Provisions", "Mart", "Agencies", "& Sons"]

/** ~120 customers; the top four are fixed so the demo stays familiar. */
export function makeCustomers(): Customer[] {
  const top: Customer[] = [
    { id: "c1", name: "Lakshmi Stores", due: 12400, days: 18 },
    { id: "c2", name: "Anil Kirana", due: 9300, days: 9 },
    { id: "c3", name: "Ramesh", due: 6100, days: 4 },
    { id: "c4", name: "Kiran Traders", due: 3800, days: 2 },
  ]
  const rest: Customer[] = Array.from({ length: 116 }, (_, i) => ({
    id: `c${i + 5}`,
    name: `${FIRST[Math.floor(rand(i + 3) * FIRST.length)]} ${SECOND[Math.floor(rand(i + 91) * SECOND.length)]}`,
    due: rand(i + 17) > 0.12 ? Math.round((200 + rand(i + 29) * 3400) / 50) * 50 : 0,
    days: 1 + Math.floor(rand(i + 41) * 60),
  }))
  return [...top, ...rest].sort((a, b) => b.due - a.due)
}

const PRODUCTS: [string, CatId][] = [
  ["Rice", "grains"], ["Atta", "grains"], ["Maida", "grains"], ["Poha", "grains"], ["Rava", "grains"],
  ["Toor dal", "pulses"], ["Moong dal", "pulses"], ["Chana dal", "pulses"],
  ["Sunflower oil", "oils"], ["Groundnut oil", "oils"], ["Ghee", "oils"],
  ["Sugar", "sugar"], ["Salt", "sugar"], ["Jaggery", "sugar"],
  ["Turmeric", "spices"], ["Chilli powder", "spices"], ["Jeera", "spices"], ["Pepper", "spices"], ["Mustard", "spices"],
  ["Tea", "tea"], ["Coffee", "tea"],
  ["Biscuits", "snacks"],
  ["Soap", "home"], ["Detergent", "home"],
]
const SIZES = ["500 g", "1 kg", "5 kg", "10 kg", "25 kg"]
const UNIT: Record<CatId, string> = { grains: "bags", pulses: "bags", oils: "tins", sugar: "bags", spices: "packs", tea: "packs", snacks: "boxes", home: "pcs" }

/** ~120 stock lines. */
export function makeStock(): StockItem[] {
  const out: StockItem[] = []
  PRODUCTS.forEach(([p, cat], i) =>
    SIZES.forEach((z, k) => {
      const max = [80, 60, 40, 30, 20][k]
      out.push({
        id: `s${i}-${k}`,
        name: `${p} ${z}`,
        category: cat,
        unit: UNIT[cat],
        max,
        qty: rand(i * 3 + k * 7 + 1) < 0.015 ? 0 : 1 + Math.floor(rand(i * 11 + k + 5) * max),
        price: Math.round((30 + rand(i * 5 + k) * 90) * [0.5, 1, 4.5, 9, 22][k]),
        added: i * 5 + k,
      })
    })
  )
  return out
}
