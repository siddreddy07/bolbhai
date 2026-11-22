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

// ---- the shelf follows the bill ----
// Every change to a bill's items moves the shop's stock in the SAME SQL statement, so the two can never disagree
// (a statement is atomic). The move is relative (stock = stock + difference), so two changes at once cannot overwrite each other,
// and a bill that is being edited is locked (FOR UPDATE) until the first change is done.
// Selling more than the shelf has is allowed: the stock goes below zero instead of silently losing the difference.

export type StockNow = { productId: string; stock: number };

// The stock of some products of one shop, as it is now.
async function stockOf(shopId: string, pids: string[]): Promise<StockNow[]> {
  if (!pids.length) return [];
  const plan = db.raw.sql`
    SELECT "productId"::text AS product_id, stock::text AS stock
    FROM shop_inventory
    WHERE "shopId" = ${shopId}::uuid
      AND "productId"::text IN (SELECT jsonb_array_elements_text(${JSON.stringify(pids)}::jsonb))
  `
    .returnsRow({ product_id: "pg/text@1", stock: "pg/text@1" })
    .build();
  return (await db.query(plan)).map((r) => ({
    productId: r.product_id,
    stock: Number(r.stock),
  }));
}

const pidsOf = (...lists: Line[][]) => [
  ...new Set(lists.flat().map((l) => l.pid)),
];

// A new bill: it is saved and its items come off the shelf, in one statement.
export async function createInvoice(shopId: string, data: InvoiceInput) {
  const plan = db.raw.sql`
    WITH created AS (
      INSERT INTO invoices (id, "shopId", items, payment, "paymentType")
      VALUES (gen_random_uuid(), ${shopId}::uuid, (${JSON.stringify(data.items)}::jsonb)::json, ${data.payment}, ${data.paymentType})
      RETURNING id
    ),
    moved AS (
      UPDATE shop_inventory i
      SET stock = i.stock - l.quantity, "updatedAt" = now()
      FROM (
        SELECT pid, sum(quantity) AS quantity
        FROM jsonb_to_recordset(${JSON.stringify(data.items)}::jsonb) AS x(pid uuid, quantity numeric)
        GROUP BY pid
      ) l
      WHERE i."shopId" = ${shopId}::uuid AND i."productId" = l.pid
      RETURNING 1
    )
    SELECT id::text AS id FROM created
  `
    .returnsRow({ id: "pg/text@1" })
    .build();
  const [created] = await db.query(plan);

  // the optional fields that do not touch the stock
  if (data.date || data.transactionId) {
    await invoices.where({ id: created.id }).update({
      ...(data.date ? { date: new Date(data.date) } : {}),
      ...(data.transactionId ? { transactionId: data.transactionId } : {}),
    });
  }
  return {
    invoice: (await getInvoice(created.id))!,
    stock: await stockOf(shopId, pidsOf(data.items)),
  };
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

// Edit a bill. New items: saved, and the shelf moves by the difference (old quantity - new quantity), in one statement.
// The other fields (payment, type, date, transaction id) do not touch the stock.
export async function updateInvoice(id: string, data: UpdateInvoiceInput) {
  const before = await getInvoice(id);
  if (!before) return null;

  if (data.items) {
    const plan = db.raw.sql`
      WITH old AS (
        SELECT id, "shopId", items::jsonb AS items FROM invoices WHERE id = ${id}::uuid FOR UPDATE
      ),
      changed AS (
        UPDATE invoices SET items = (${JSON.stringify(data.items)}::jsonb)::json
        FROM old WHERE invoices.id = old.id
        RETURNING invoices.id
      ),
      delta AS (
        SELECT coalesce(o.pid, n.pid) AS pid, coalesce(o.quantity, 0) - coalesce(n.quantity, 0) AS diff
        FROM (
          SELECT pid, sum(quantity) AS quantity
          FROM jsonb_to_recordset((SELECT items FROM old)) AS x(pid uuid, quantity numeric)
          GROUP BY pid
        ) o
        FULL JOIN (
          SELECT pid, sum(quantity) AS quantity
          FROM jsonb_to_recordset(${JSON.stringify(data.items)}::jsonb) AS x(pid uuid, quantity numeric)
          GROUP BY pid
        ) n ON n.pid = o.pid
      ),
      moved AS (
        UPDATE shop_inventory i
        SET stock = i.stock + delta.diff, "updatedAt" = now()
        FROM delta, old
        WHERE i."shopId" = old."shopId" AND i."productId" = delta.pid AND delta.diff <> 0
        RETURNING 1
      )
      SELECT count(*)::text AS changed FROM changed
    `
      .returnsRow({ changed: "pg/text@1" })
      .build();
    const [row] = await db.query(plan);
    if (!Number(row?.changed ?? 0)) return null; // deleted meanwhile
  }

  const rest = {
    ...(data.payment ? { payment: data.payment } : {}),
    ...(data.paymentType ? { paymentType: data.paymentType } : {}),
    ...(data.transactionId !== undefined
      ? { transactionId: data.transactionId }
      : {}),
    ...(data.date ? { date: new Date(data.date) } : {}),
  };
  if (Object.keys(rest).length) await invoices.where({ id }).update(rest);

  const invoice = await getInvoice(id);
  if (!invoice) return null;
  return {
    invoice,
    stock: data.items
      ? await stockOf(before.shopId, pidsOf(before.items, data.items))
      : [],
  };
}

// Delete a bill: its items go back on the shelf, in one statement.
export async function deleteInvoice(id: string) {
  const plan = db.raw.sql`
    WITH gone AS (
      DELETE FROM invoices WHERE id = ${id}::uuid RETURNING "shopId", items::jsonb AS items
    ),
    moved AS (
      UPDATE shop_inventory i
      SET stock = i.stock + l.quantity, "updatedAt" = now()
      FROM gone g,
        LATERAL (
          SELECT pid, sum(quantity) AS quantity
          FROM jsonb_to_recordset(g.items) AS x(pid uuid, quantity numeric)
          GROUP BY pid
        ) l
      WHERE i."shopId" = g."shopId" AND i."productId" = l.pid
      RETURNING 1
    )
    SELECT "shopId"::text AS shop_id, items::text AS items FROM gone
  `
    .returnsRow({ shop_id: "pg/text@1", items: "pg/text@1" })
    .build();
  const [gone] = await db.query(plan);
  if (!gone) return null;
  return {
    stock: await stockOf(
      gone.shop_id,
      pidsOf(JSON.parse(gone.items) as Line[]),
    ),
  };
}
