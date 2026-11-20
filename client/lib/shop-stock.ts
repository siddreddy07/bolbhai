import starter from "@/lib/starter-products.json"
import type { CatId, StockItem } from "@/lib/mock-data"

const UNIT: Record<CatId, string> = {
  cereals: "bags", dairy: "packs", drinks: "packs", snacks: "packs", cooking: "packs",
  fruits: "kg", meals: "packs", meat: "pcs", other: "pcs",
}
const MAX = 20
const keyOf = (shopId: string) => `bolbhai:stock:${shopId}`

/** A fresh shelf for a new shop: the starter products with a random 0 to 20 of each. */
function makeStarterStock(): StockItem[] {
  return (starter as [string, CatId][]).map(([name, category], i) => ({
    id: `p${i}`,
    name,
    category,
    unit: UNIT[category],
    qty: Math.floor(Math.random() * (MAX + 1)),
    max: MAX,
    price: 20 + Math.floor(Math.random() * 38) * 10,
    added: i,
  }))
}

/** This shop's stock from localStorage. The first visit fills it with the starter products. */
export function loadShopStock(shopId: string): StockItem[] {
  try {
    const saved = localStorage.getItem(keyOf(shopId))
    if (saved) return JSON.parse(saved) as StockItem[]
  } catch {
    // unreadable: start over below
  }
  const fresh = makeStarterStock()
  saveShopStock(shopId, fresh)
  return fresh
}

export function saveShopStock(shopId: string, stock: StockItem[]) {
  try {
    localStorage.setItem(keyOf(shopId), JSON.stringify(stock))
  } catch {
    // storage full or blocked: the page still works for this visit
  }
}
