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
  customerId?: string | null
  customerName?: string | null
  customerPhone?: string | null
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
  customerId: r.customerId,
  customerName: r.customerName,
  customerPhone: r.customerPhone,
})

/**
 * GET /api/invoices/shop/:shopId: some of the shop's bills, newest first. Ask for ONE of these:
 * a day ("2026-11-20"), a bill number to look up ("3fa2"), or only the unpaid bills.
 */
export async function fetchInvoices(
  shopId: string,
  params: { day?: string; q?: string; unpaid?: boolean }
) {
  const { data } = await api.get<InvoiceRow[]>(`/api/invoices/shop/${shopId}`, {
    params: {
      day: params.day,
      q: params.q,
      unpaid: params.unpaid ? 1 : undefined,
    },
  })
  return data.map(toInvoice)
}

/** POST /api/invoices/shop/:shopId */
export async function createInvoice(
  shopId: string,
  items: BillLine[],
  payment: Payment,
  paymentType: PaymentType,
  customerId?: string
) {
  const { data } = await api.post<InvoiceRow & { stock: StockNow }>(
    `/api/invoices/shop/${shopId}`,
    { items, payment, paymentType, customerId }
  )
  return { invoice: toInvoice(data), stock: data.stock }
}

/** PUT /api/invoices/:id: only what changed. */
export async function updateInvoice(
  id: string,
  changes: {
    items?: BillLine[]
    payment?: Payment
    paymentType?: PaymentType
    customerId?: string | null
  }
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

/** Sales of one period (today, this week or this month), worked out by the server. */
type AnalyticsPeriod = {
  label: string
  /** all sales in the period (paid and unpaid bills) */
  total: number
  bills: number
  /** the part of `total` still unpaid */
  unpaid: number
  /** the same sales in the period before */
  previous: number
  /** percent change against the period before; null when there was nothing to compare with */
  change: number | null
  vs: string
  bars: number[]
  names: string[]
}

export type Analytics = {
  day: AnalyticsPeriod
  week: AnalyticsPeriod
  month: AnalyticsPeriod
  /** the bar that is "now" in each period */
  now: { day: number; week: number; month: number }
}

/**
 * GET /api/invoices/shop/:shopId/analytics: everything the dashboard needs, in ONE request
 * (and one database call): the graphs for today, this week and this month, and today's bills.
 */
export async function fetchAnalytics(shopId: string) {
  const { data } = await api.get<Analytics & { bills: InvoiceRow[] }>(
    `/api/invoices/shop/${shopId}/analytics`
  )
  const { bills, ...analytics } = data
  return { analytics: analytics as Analytics, bills: bills.map(toInvoice) }
}
