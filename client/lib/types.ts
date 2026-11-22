// Shapes shared by the dashboard (the data itself comes from the server).

/** One line of a bill, as the server keeps it: the product (its id in the products table) and how many. */
export type BillLine = {
  pid: string
  quantity: number
}
/** PAID = settled. LEDGER = not paid yet, written in the ledger (khata). */
export type Payment = "PAID" | "LEDGER"
export type PaymentType = "CASH" | "UPI"
/** A bill. The names and prices come from the saved inventory. */
export type Invoice = {
  id: string
  shopId: string
  /** when it was made (ms) */
  date: number
  items: BillLine[]
  payment: Payment
  paymentType: PaymentType
  transactionId: string | null
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
