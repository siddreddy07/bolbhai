import { api } from "@/lib/proxy"
import type { BillLine, Invoice, Payment, PaymentType } from "@/lib/types"

// What the invoice routes send: the date comes as text.
type InvoiceRow = {
  id: string
  shopId: string
  date: string
  items: BillLine[]
  payment: Payment
  paymentType: PaymentType
  transactionId: string | null
}

/** The stock of the products a bill change touched, as the server has it now (the shelf moves with the bill, on the server). */
export type StockNow = { productId: string; stock: number }[]

const toInvoice = (r: InvoiceRow): Invoice => ({
  id: r.id,
  shopId: r.shopId,
  date: new Date(r.date).getTime(),
  items: r.items,
  payment: r.payment,
  paymentType: r.paymentType,
  transactionId: r.transactionId,
})

/** GET /api/invoices/shop/:shopId: every invoice of the shop, newest first. */
export async function fetchInvoices(shopId: string) {
  const { data } = await api.get<InvoiceRow[]>(`/api/invoices/shop/${shopId}`)
  return data.map(toInvoice)
}

/** POST /api/invoices/shop/:shopId */
export async function createInvoice(
  shopId: string,
  items: BillLine[],
  payment: Payment,
  paymentType: PaymentType
) {
  const { data } = await api.post<InvoiceRow & { stock: StockNow }>(
    `/api/invoices/shop/${shopId}`,
    { items, payment, paymentType }
  )
  return { invoice: toInvoice(data), stock: data.stock }
}

/** PUT /api/invoices/:id: only what changed. */
export async function updateInvoice(
  id: string,
  changes: { items?: BillLine[]; payment?: Payment; paymentType?: PaymentType }
) {
  const { data } = await api.put<InvoiceRow & { stock: StockNow }>(
    `/api/invoices/${id}`,
    changes
  )
  return { invoice: toInvoice(data), stock: data.stock }
}

/** DELETE /api/invoices/:id */
export async function deleteInvoice(id: string) {
  const { data } = await api.delete<{ stock: StockNow }>(`/api/invoices/${id}`)
  return data.stock
}
