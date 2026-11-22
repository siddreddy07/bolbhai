import { create } from "zustand"

import { api } from "@/lib/proxy"
import type { CatId, StockItem } from "@/lib/mock-data"

/** A catalog product the shopkeeper can pick (from GET /api/products/search). */
export type CatalogProduct = {
  id: string
  name: string
  brand: string | null
  size: string | null
  category: string | null
  price: number
}

// What GET /api/shops/:id/inventory sends for each product.
type InventoryRow = {
  id: string
  productId: string | null
  name: string
  brand: string | null
  size: string | null
  category: string | null
  stock: number
  unit: string | null
  price: number
}

// The catalog's category names -> the short ids the stock page uses.
const CATEGORY: Record<string, CatId> = {
  Cereals: "cereals",
  Dairy: "dairy",
  Drinks: "drinks",
  Snacks: "snacks",
  Cooking: "cooking",
  "Fruit & veg": "fruits",
  "Ready meals": "meals",
  "Meat & eggs": "meat",
}

// The shop's stock is kept in localStorage, one entry per shop, so opening the stock page again does not ask the server again.
// The + / - counts live there too (they are not saved on the server yet).
const stockKey = (shopId: string) => `bolbhai:stock:${shopId}`

/** What localStorage keeps for a shop: the stock, when it was last saved on the server (ms), and the ids whose count changed since. */
export type StockCache = {
  stock: StockItem[]
  syncedAt: number
  dirtyIds: string[]
}

export function readStockCache(shopId: string): StockCache | null {
  try {
    const saved = JSON.parse(localStorage.getItem(stockKey(shopId)) ?? "null")
    if (Array.isArray(saved)) return { stock: saved, syncedAt: 0, dirtyIds: [] } // the older format: a plain list
    return saved?.stock ? ({ dirtyIds: [], ...saved } as StockCache) : null
  } catch {
    return null // unreadable: ask the server
  }
}

export function writeStockCache(shopId: string, cache: StockCache) {
  try {
    localStorage.setItem(stockKey(shopId), JSON.stringify(cache))
  } catch {
    // storage full or blocked: the page still works for this visit
  }
}

/** The same text always gives the same key: "  ATA " and "ata" are one search. */
export const searchKey = (text: string) =>
  text.trim().toLowerCase().replace(/\s+/g, " ")

type InventoryState = {
  /** Every search we already did, by its key. Typing "ata" twice asks the server only once. */
  cache: Record<string, CatalogProduct[]>
  /** The answer to an earlier search, or undefined if we never asked. */
  cached: (text: string) => CatalogProduct[] | undefined
  /** Asks the server and remembers the answer. */
  search: (text: string) => Promise<CatalogProduct[]>
  /** Puts the picked catalog products on this shop's shelf, each with its stock. Returns how many were new. */
  addProducts: (
    shopId: string,
    items: { productId: string; stock: number }[]
  ) => Promise<number>
  /** Saves new counts (many at once). */
  saveStock: (
    shopId: string,
    items: { id: string; stock: number }[]
  ) => Promise<void>
  /** Takes one product off this shop's shelf. */
  removeProduct: (shopId: string, itemId: string) => Promise<void>
  /** The shop's stock, straight from the database, shaped for the stock page. */
  fetchStock: (shopId: string) => Promise<StockItem[]>
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  cache: {},
  cached: (text) => get().cache[searchKey(text)],
  search: async (text) => {
    const key = searchKey(text)
    const { data } = await api.get<CatalogProduct[]>("/api/products/search", {
      params: { q: key },
    })
    set((s) => ({ cache: { ...s.cache, [key]: data } }))
    return data
  },
  addProducts: async (shopId, items) => {
    const { data } = await api.post<{ added: number }>(
      `/api/shops/${shopId}/inventory`,
      { items }
    )
    return data.added
  },
  saveStock: async (shopId, items) => {
    await api.patch(`/api/shops/${shopId}/inventory`, { items })
  },
  removeProduct: async (shopId, itemId) => {
    await api.delete(`/api/shops/${shopId}/inventory/${itemId}`)
  },
  fetchStock: async (shopId) => {
    const { data } = await api.get<InventoryRow[]>(
      `/api/shops/${shopId}/inventory`
    )
    return data.map((row, i) => ({
      id: row.id,
      productId: row.productId,
      name: row.brand ? `${row.brand} ${row.name}` : row.name,
      category: (row.category && CATEGORY[row.category]) || "other",
      unit: row.unit ?? "pcs",
      size: row.size,
      qty: row.stock,
      max: Math.max(20, row.stock), // what a full shelf looks like, for the low-stock alert
      price: row.price,
      added: data.length - i, // the server sends the newest first
    }))
  },
}))
