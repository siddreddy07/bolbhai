// Shapes shared by the dashboard (the data itself comes from the server).

export type Invoice = {
  id: number
  who: string
  amount: number
  status: "Paid" | "Khata"
  daysAgo: number
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
