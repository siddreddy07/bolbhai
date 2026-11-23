import { redis } from "../config/redis.js";
import { db } from "../prisma/db.js";

// A shop's whole shelf is ONE value in Redis (key stock:{shopId}), kept 10 minutes after its last use.
// Every "how many are left?" and "is there enough?" is answered from there, so the database is not asked again and again.
// The database is read once to fill it, and written once when a bill (or the stock page) is saved.

if (!redis) console.error("Stock needs Redis: add UPSTASH_REDIS_REST_URL / TOKEN");

const KEEP_SECONDS = 10 * 60;
const key = (shopId: string) => `stock:${shopId}`;

type Row = { id: string; productId: string | null; stock: number };
export type StockNow = { productId: string; stock: number };

function cache() {
  if (!redis) throw new Error("Redis is not set up: add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN");
  return redis;
}

/** The shop's shelf: from Redis, or (when Redis does not have it) from the database, once. */
async function getShelf(shopId: string) {
  const saved = await cache().get<Row[]>(key(shopId));
  if (saved) return saved;

  const plan = db.raw.sql`
    SELECT id::text AS id, "productId"::text AS product_id, stock::text AS stock
    FROM shop_inventory
    WHERE "shopId" = ${shopId}::uuid
  `
    .returnsRow({ id: "pg/text@1", product_id: { codecId: "pg/text@1", nullable: true }, stock: "pg/text@1" })
    .build();
  const shelf: Row[] = (await db.query(plan)).map((r) => ({ id: r.id, productId: r.product_id, stock: Number(r.stock) }));
  await cache().set(key(shopId), shelf, { ex: KEEP_SECONDS });
  return shelf;
}

/** Writes the changed rows to the database in ONE statement, then puts the new shelf in Redis. */
async function saveShelf(shopId: string, shelf: Row[], changed: Row[]) {
  if (changed.length) {
    const plan = db.raw.sql`
      WITH changed AS (
        UPDATE shop_inventory i
        SET stock = x.stock, "updatedAt" = now()
        FROM jsonb_to_recordset(${JSON.stringify(changed.map((r) => ({ id: r.id, stock: r.stock })))}::jsonb) AS x(id uuid, stock numeric)
        WHERE i.id = x.id AND i."shopId" = ${shopId}::uuid
        RETURNING 1
      )
      SELECT count(*)::text AS changed FROM changed
    `
      .returnsRow({ changed: "pg/text@1" })
      .build();
    await db.query(plan);
  }
  await cache().set(key(shopId), shelf, { ex: KEEP_SECONDS });
}

/** The stock now of some inventory rows (by inventory id). */
export async function liveStock(shopId: string) {
  return new Map((await getShelf(shopId)).map((r) => [r.id, r.stock]));
}

/** The stock now of some products (by product id). */
export async function stockOfProducts(shopId: string, pids: string[]): Promise<StockNow[]> {
  const shelf = await getShelf(shopId);
  return shelf.filter((r) => r.productId && pids.includes(r.productId)).map((r) => ({ productId: r.productId!, stock: r.stock }));
}

/**
 * Moves the shelf: each change is a product and how much to ADD (a minus takes off the shelf).
 * Asking for more than is left changes nothing and says which product and how many are left.
 */
export async function moveStock(shopId: string, changes: { pid: string; delta: number }[]) {
  const shelf = await getShelf(shopId);
  const changed: Row[] = [];
  for (const c of changes) {
    const row = shelf.find((r) => r.productId === c.pid);
    if (!row || c.delta === 0) continue; // not on this shelf: nothing to move
    if (row.stock + c.delta < 0) return { ok: false as const, short: { pid: c.pid, left: Math.max(0, row.stock) } };
    changed.push({ ...row, stock: row.stock + c.delta });
  }
  if (changed.length) {
    await saveShelf(shopId, shelf.map((r) => changed.find((c) => c.id === r.id) ?? r), changed);
  }
  return { ok: true as const };
}

/** The stock page's new counts (by inventory id). Only rows this shop has are taken. */
export async function setCounts(shopId: string, items: { id: string; stock: number }[]) {
  const shelf = await getShelf(shopId);
  const changed = shelf.filter((r) => items.some((i) => i.id === r.id)).map((r) => ({ ...r, stock: items.find((i) => i.id === r.id)!.stock }));
  if (changed.length) await saveShelf(shopId, shelf.map((r) => changed.find((c) => c.id === r.id) ?? r), changed);
  return changed.length;
}

/** The shelf changed some other way (a product added or removed, a shop deleted): forget it, it is read again next time. */
export async function forgetShelf(shopId: string) {
  if (redis) await redis.del(key(shopId));
}
