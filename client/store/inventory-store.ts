import { create } from "zustand"

import { api } from "@/lib/proxy"
import type { CatId, StockItem } from "@/lib/types"

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
  /** Saves new counts (many at once). `leaving`: the page may be closing, so the request is sent in a way the browser finishes even then. */
  saveStock: (
    shopId: string,
    items: { id: string; stock: number }[],
    leaving?: boolean
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
  saveStock: async (shopId, items, leaving = false) => {
    if (leaving) {
      // keepalive: the browser finishes this request even when the page is closing or reloading
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shops/${shopId}/inventory`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
        credentials: "include",
        keepalive: true,
      })
      return
    }
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
      unit: "pcs", // stock is counted in pieces
      size: row.size,
      qty: row.stock,
      max: Math.max(20, row.stock), // what a full shelf looks like, for the low-stock alert
      price: row.price,
      added: data.length - i, // the server sends the newest first
    }))
  },
}))
