import { db } from "../prisma/db.js";
import type {
  InvoiceInput,
  UpdateInvoiceInput,
} from "../schemas/invoice.schema.js";

const invoices = db.orm.public.invoices;

type Line = { pid: string; quantity: number };
type InvoiceRow = {
  id: string;
  shopId: string;
  date: Date | string;
  items: unknown;
  payment: string;
  paymentType: string;
  transactionId: string | null;
};

// What leaves the server for one invoice.
function publicInvoice(row: InvoiceRow) {
  return {
    id: row.id,
    shopId: row.shopId,
    date: row.date,
    items: row.items as Line[],
    payment: row.payment as "PAID" | "LEDGER",
    paymentType: row.paymentType as "CASH" | "UPI",
    transactionId: row.transactionId,
  };
}

export async function createInvoice(shopId: string, data: InvoiceInput) {
  const row = await invoices.create({
    shopId,
    items: data.items,
    payment: data.payment,
    paymentType: data.paymentType,
    transactionId: data.transactionId ?? null,
    ...(data.date ? { date: new Date(data.date) } : {}),
  });
  return publicInvoice(row);
}

export async function getInvoice(id: string) {
  const row = await invoices.first({ id });
  return row ? publicInvoice(row) : null;
}

// All invoices of one shop, newest first, in ONE query.
export async function getInvoices(shopId: string) {
  const plan = db.raw.sql`
    SELECT id::text AS id, "shopId"::text AS shop_id, date::text AS date, items::text AS items, payment, "paymentType" AS payment_type, "transactionId" AS transaction_id
    FROM invoices
    WHERE "shopId" = ${shopId}::uuid
    ORDER BY date DESC
  `
    .returnsRow({
      id: "pg/text@1",
      shop_id: "pg/text@1",
      date: "pg/text@1",
      items: "pg/text@1",
      payment: "pg/text@1",
      payment_type: "pg/text@1",
      transaction_id: { codecId: "pg/text@1", nullable: true },
    })
    .build();

  const rows = await db.query(plan);
  return rows.map((r) => ({
    id: r.id,
    shopId: r.shop_id,
    date: new Date(r.date),
    items: JSON.parse(r.items) as Line[],
    payment: r.payment as "PAID" | "LEDGER",
    paymentType: r.payment_type as "CASH" | "UPI",
    transactionId: r.transaction_id,
  }));
}

export async function updateInvoice(id: string, data: UpdateInvoiceInput) {
  const changes = {
    ...(data.items ? { items: data.items } : {}),
    ...(data.payment ? { payment: data.payment } : {}),
    ...(data.paymentType ? { paymentType: data.paymentType } : {}),
    ...(data.transactionId !== undefined
      ? { transactionId: data.transactionId }
      : {}),
    ...(data.date ? { date: new Date(data.date) } : {}),
  };
  const row = await invoices.where({ id }).update(changes);
  return row ? publicInvoice(row) : null;
}

export function deleteInvoice(id: string) {
  return invoices.where({ id }).delete();
}
