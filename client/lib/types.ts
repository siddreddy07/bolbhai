// Shapes shared by the dashboard (the data itself comes from the server).

/** One line of a bill: a shelf item, how many, and its price when it was added. */
export type BillLine = {
  /** the shop_inventory id */
  itemId: string
  name: string
  size?: string | null
  qty: number
  price: number
}
/** A bill. "Open" = made, not paid yet: items can still be added. Kept in localStorage, one list per shop. */
export type Invoice = {
  id: number
  who: string
  amount: number
  status: "Open" | "Paid" | "Khata"
  /** when it was made (ms) */
  createdAt: number
  items: BillLine[]
}
/** One thing asked for in an order, with the shelf items that fit it (taken from the saved inventory). */
export type OrderLine = {
  query: string
  quantity: number | null
  unit: string | null
  matches: StockItem[]
  /** which match is chosen */
  pick: number
}
export type Customer = { id: string; name: string; due: number; days: number }
// Short names for the catalog's own groups (see CATS in components/dashboard/stock/kit.tsx)
export type CatId =
  | "cereals"
  | "dairy"
  | "drinks"
  | "snacks"
  | "cooking"
  | "fruits"
  | "meals"
  | "meat"
  | "other"
export type StockItem = {
  id: string
  /** the catalog product this is (null or missing for a shop's own item) */
  productId?: string | null
  name: string
  category: CatId
  unit: string
  /** the pack, like "1kg" or "500g" (empty for a shop's own item) */
  size?: string | null
  qty: number
  /** what a full shelf looks like (drives the low-stock alert) */
  max: number
  price: number
  /** bigger = added more recently */
  added: number
}
