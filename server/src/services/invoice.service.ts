import { db } from "../prisma/db.js";
import { sizeLabel } from "./pack-size.js";
import { moveStock, stockOfProducts, type StockNow } from "./stock-cache.service.js";
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
  customerId: string | null;
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
    customerId: row.customerId,
  };
}

// ---- the shelf follows the bill ----
// The shelf lives in Redis (stock-cache.service): a bill's items move it THERE, and "is there enough?" is checked THERE
// (all or nothing). The database only gets the bill itself, so there are no repeated stock reads and writes.

export type { StockNow };

// How many of one product the bill lines hold.
const countOf = (lines: Line[], pid: string) =>
  lines.filter((l) => l.pid === pid).reduce((n, l) => n + l.quantity, 0);

const pidsOf = (...lists: Line[][]) => [...new Set(lists.flat().map((l) => l.pid))];

// What the shelf gets when a bill goes from `before` to `after`: what the bill gained leaves the shelf, what it lost goes back.
const shelfChanges = (before: Line[], after: Line[]) =>
  pidsOf(before, after).map((pid) => ({ pid, delta: countOf(before, pid) - countOf(after, pid) }));

// A new bill: its items come off the shelf (refused when there is not enough), then the bill is saved.
export async function createInvoice(shopId: string, data: InvoiceInput) {
  const moved = await moveStock(shopId, shelfChanges([], data.items));
  if (!moved.ok) return { short: moved.short, stock: await stockOfProducts(shopId, pidsOf(data.items)) };

  let id: string;
  try {
    const plan = db.raw.sql`
      INSERT INTO invoices (id, "shopId", "customerId", items, payment, "paymentType")
      VALUES (gen_random_uuid(), ${shopId}::uuid, NULLIF(${data.customerId ?? ""}::text, '')::uuid, (${JSON.stringify(data.items)}::jsonb)::json, ${data.payment}, ${data.paymentType})
      RETURNING id::text AS id
    `
      .returnsRow({ id: "pg/text@1" })
      .build();
    [{ id }] = await db.query(plan);
  } catch (error) {
    await moveStock(shopId, shelfChanges(data.items, [])); // not saved: the items go back on the shelf
    throw error;
  }

  // the optional date
  if (data.date) await invoices.where({ id }).update({ date: new Date(data.date) });
  return {
    invoice: (await getInvoice(id))!,
    stock: await stockOfProducts(shopId, pidsOf(data.items)),
  };
}

export async function getInvoice(id: string) {
  const row = await invoices.first({ id });
  return row ? publicInvoice(row) : null;
}

// Some invoices of one shop, newest first, in ONE query: one day, or a bill number, or only the unpaid ones.
// An empty text / 0 means "do not filter on this". Days are India days.
export type InvoiceFilter = { day?: string; q?: string; unpaid?: boolean };

export async function getInvoices(shopId: string, filter: InvoiceFilter = {}) {
  const day = filter.day ?? "";
  const q = (filter.q ?? "").toLowerCase();
  const unpaid = filter.unpaid ? 1 : 0;
  const limit = q ? 30 : unpaid ? 500 : 300; // never send everything
  const plan = db.raw.sql`
    SELECT i.id::text AS id, i."shopId"::text AS shop_id, i.date::text AS date, i.items::text AS items, i.payment, i."paymentType" AS payment_type,
      i."customerId"::text AS customer_id, c.name AS customer_name, c.phone AS customer_phone,
      EXISTS (SELECT 1 FROM customer_transactions t WHERE t."invoiceId" = i.id) AS paid_online
    FROM invoices i
    LEFT JOIN customers c ON c.id = i."customerId"
    WHERE i."shopId" = ${shopId}::uuid
      AND (${day}::text = '' OR (i.date AT TIME ZONE 'Asia/Kolkata')::date = NULLIF(${day}::text, '')::date)
      AND (${q}::text = '' OR i.id::text LIKE (${q}::text || '%') OR c.name ILIKE ('%' || ${q}::text || '%') OR c.phone LIKE ('%' || ${q}::text || '%'))
      AND (${unpaid}::int = 0 OR i.payment = 'LEDGER')
    ORDER BY i.date DESC
    LIMIT ${limit}::int
  `
    .returnsRow({
      id: "pg/text@1",
      shop_id: "pg/text@1",
      date: "pg/text@1",
      items: "pg/text@1",
      payment: "pg/text@1",
      payment_type: "pg/text@1",
      customer_id: { codecId: "pg/text@1", nullable: true },
      customer_name: { codecId: "pg/text@1", nullable: true },
      customer_phone: { codecId: "pg/text@1", nullable: true },
      paid_online: "pg/bool@1",
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
    customerId: r.customer_id,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    paidOnline: r.paid_online,
  }));
}

// Edit a bill. New items: saved, and the shelf moves by the difference (old quantity - new quantity), in one statement.
// The other fields (payment, type, date, transaction id) do not touch the stock.
// The khata: one shop's unpaid bills (payment = LEDGER), newest first, with everything the page shows worked out here:
// each line's name, pack and the shop's selling price, and each bill's total, in ONE query.
// `count` and `totalDue` cover ALL unpaid bills, even when `limit` sends fewer.
export async function getUnpaidInvoices(shopId: string, limit = 100) {
  const plan = db.raw.sql`
    SELECT id, date, payment_type, items, total, count(*) OVER ()::text AS all_count, sum(total) OVER ()::text AS all_total
    FROM (
      SELECT inv.id::text AS id, inv.date::text AS date, inv."paymentType" AS payment_type,
        jsonb_agg(
          jsonb_build_object(
            'pid', l.pid, 'quantity', l.quantity,
            'name', coalesce(p.name, 'Removed item'), 'brand', p.brand,
            'packQuantity', p.quantity, 'packUnit', p.unit,
            'price', coalesce(si."sellingPrice", 0)
          )
        )::text AS items,
        sum(l.quantity * coalesce(si."sellingPrice", 0)) AS total,
        inv.date AS sort_date
      FROM invoices inv
      CROSS JOIN LATERAL jsonb_to_recordset(inv.items::jsonb) AS l(pid uuid, quantity numeric)
      LEFT JOIN shop_inventory si ON si."shopId" = inv."shopId" AND si."productId" = l.pid
      LEFT JOIN products p ON p.id = l.pid
      WHERE inv."shopId" = ${shopId}::uuid AND inv.payment = 'LEDGER'
      GROUP BY inv.id
    ) unpaid
    ORDER BY sort_date DESC
    LIMIT ${limit}
  `
    .returnsRow({
      id: "pg/text@1",
      date: "pg/text@1",
      payment_type: "pg/text@1",
      items: "pg/text@1",
      total: "pg/text@1",
      all_count: "pg/text@1",
      all_total: "pg/text@1",
    })
    .build();

  const rows = await db.query(plan);
  type RawLine = { pid: string; quantity: number; name: string; brand: string | null; packQuantity: string | number | null; packUnit: string | null; price: number | string };
  return {
    // zero rows = no unpaid bill at all
    count: Number(rows[0]?.all_count ?? 0),
    totalDue: Number(rows[0]?.all_total ?? 0),
    invoices: rows.map((r) => {
      const items = (JSON.parse(r.items) as RawLine[]).map((l) => ({
        pid: l.pid,
        quantity: Number(l.quantity),
        name: l.name,
        brand: l.brand,
        size: sizeLabel({ quantity: l.packQuantity === null ? null : String(l.packQuantity), unit: l.packUnit }),
        price: Number(l.price),
      }));
      return {
        id: r.id,
        date: new Date(r.date),
        paymentType: r.payment_type as "CASH" | "UPI",
        itemCount: items.reduce((n, l) => n + l.quantity, 0),
        total: Number(r.total),
        items,
      };
    }),
  };
}

// A bill can be edited (its items) only while it is not paid AND it is under 24 hours old.
export const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;
export const isLocked = (inv: { payment: string; date: Date | string | number }) =>
  inv.payment === "PAID" || Date.now() - new Date(inv.date).getTime() >= EDIT_WINDOW_MS;

export async function updateInvoice(id: string, data: UpdateInvoiceInput) {
  const before = await getInvoice(id);
  if (!before) return null;

  const pids = data.items ? pidsOf(before.items, data.items) : [];
  if (data.items) {
    // the shelf moves by the difference; asking for MORE than is left is refused and says how many are left
    const moved = await moveStock(before.shopId, shelfChanges(before.items, data.items));
    if (!moved.ok) return { short: moved.short, stock: await stockOfProducts(before.shopId, pids) };
  }

  const changes = {
    ...(data.items ? { items: data.items } : {}),
    ...(data.payment ? { payment: data.payment } : {}),
    ...(data.paymentType ? { paymentType: data.paymentType } : {}),
    ...(data.date ? { date: new Date(data.date) } : {}),
    ...(data.customerId !== undefined ? { customerId: data.customerId } : {}),
  };
  try {
    if (Object.keys(changes).length) await invoices.where({ id }).update(changes);
  } catch (error) {
    if (data.items) await moveStock(before.shopId, shelfChanges(data.items, before.items)); // not saved: the shelf goes back
    throw error;
  }

  const invoice = await getInvoice(id);
  if (!invoice) return null;
  return { invoice, stock: data.items ? await stockOfProducts(before.shopId, pids) : [] };
}

// Delete a bill: its items go back on the shelf.
export async function deleteInvoice(id: string) {
  const plan = db.raw.sql`
    DELETE FROM invoices WHERE id = ${id}::uuid
    RETURNING "shopId"::text AS shop_id, items::text AS items
  `
    .returnsRow({ shop_id: "pg/text@1", items: "pg/text@1" })
    .build();
  const [gone] = await db.query(plan);
  if (!gone) return null;
  const items = JSON.parse(gone.items) as Line[];
  await moveStock(gone.shop_id, shelfChanges(items, []));
  return { stock: await stockOfProducts(gone.shop_id, pidsOf(items)) };
}
