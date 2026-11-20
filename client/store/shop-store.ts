import { create } from "zustand"

import type { Shop } from "@/lib/shop"

type ShopState = {
  shops: Shop[]
  /** The shop the dashboard is showing. null = this owner has no shop (or we have not asked yet). */
  shop: Shop | null
  /** true once we asked the server for the owner's shops */
  loaded: boolean
  /** Which shop dialog is open from the menu. */
  dialog: "add" | "edit" | null
  setDialog: (dialog: "add" | "edit" | null) => void
  setShops: (shops: Shop[]) => void
  setLoaded: (loaded: boolean) => void
  /** A new shop becomes the one on screen. */
  addShop: (shop: Shop) => void
  updateShop: (shop: Shop) => void
  /** Drops the shop; if it was on screen, falls back to the first one left. */
  removeShop: (id: string) => void
  selectShop: (id: string) => void
  reset: () => void
}

export const useShopStore = create<ShopState>((set) => ({
  shops: [],
  shop: null,
  loaded: false,
  dialog: null,
  setDialog: (dialog) => set({ dialog }),
  setShops: (shops) => set((s) => ({ shops, shop: shops.find((x) => x.id === s.shop?.id) ?? shops[0] ?? null })),
  setLoaded: (loaded) => set({ loaded }),
  addShop: (shop) => set((s) => ({ shops: [...s.shops, shop], shop })),
  updateShop: (shop) =>
    set((s) => ({
      shops: s.shops.map((x) => (x.id === shop.id ? shop : x)),
      shop: s.shop?.id === shop.id ? shop : s.shop,
    })),
  removeShop: (id) =>
    set((s) => {
      const shops = s.shops.filter((x) => x.id !== id)
      return { shops, shop: s.shop?.id === id ? (shops[0] ?? null) : s.shop }
    }),
  selectShop: (id) => set((s) => ({ shop: s.shops.find((x) => x.id === id) ?? s.shop })),
  reset: () => set({ shops: [], shop: null, loaded: false, dialog: null }),
}))
