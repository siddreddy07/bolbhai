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
  const { data } = await api.post<InvoiceRow>(`/api/invoices/shop/${shopId}`, {
    items,
    payment,
    paymentType,
  })
  return toInvoice(data)
}

/** PUT /api/invoices/:id: only what changed. */
export async function updateInvoice(
  id: string,
  changes: { items?: BillLine[]; payment?: Payment; paymentType?: PaymentType }
) {
  const { data } = await api.put<InvoiceRow>(`/api/invoices/${id}`, changes)
  return toInvoice(data)
}

/** DELETE /api/invoices/:id */
export async function deleteInvoice(id: string) {
  await api.delete(`/api/invoices/${id}`)
}
