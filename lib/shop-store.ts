import { create } from "zustand"

import { MOCK_SHOP, SHOP_AUTHORIZED, type Shop } from "@/lib/shop"

type ShopState = {
  /** null = the shop is not set up / authorized yet */
  shop: Shop | null
  authorize: (shop: Shop) => void
  reset: () => void
}

export const useShopStore = create<ShopState>((set) => ({
  shop: SHOP_AUTHORIZED ? MOCK_SHOP : null,
  authorize: (shop) => set({ shop }),
  reset: () => set({ shop: null }),
}))

/** Derived: has this shop been set up and checked? */
export const useAuthorized = () => useShopStore((s) => s.shop !== null)
