import { db } from "../prisma/db.js";
import { sizeLabel } from "./pack-size.js";
import { forgetShelf, liveStock } from "./stock-cache.service.js";

const inventory = db.orm.public.shop_inventory;

// Everything a shop sells, in ONE query: its own stock and price joined with the catalog product (name, brand, pack size).
// A shop's own item (not in the catalog) has no product row, so its name is the customName.
export async function getInventory(shopId: string) {
  const plan = db.raw.sql`
    SELECT i.id, i."productId"::text AS product_id, coalesce(p.name, i."customName", 'Item') AS name, p.brand, p.quantity::text AS quantity, p.unit AS pack_unit,
      p.category, i.stock::text AS stock, i.unit AS stock_unit, i."sellingPrice"::text AS price
    FROM shop_inventory i
    LEFT JOIN products p ON p.id = i."productId"
    WHERE i."shopId" = ${shopId}::uuid
    ORDER BY i."createdAt" DESC
  `.returnsRow({
    id: "pg/text@1",
    product_id: { codecId: "pg/text@1", nullable: true },
    name: "pg/text@1",
    brand: { codecId: "pg/text@1", nullable: true },
    quantity: { codecId: "pg/text@1", nullable: true },
    pack_unit: { codecId: "pg/text@1", nullable: true },
    category: { codecId: "pg/text@1", nullable: true },
    stock: "pg/text@1",
    stock_unit: { codecId: "pg/text@1", nullable: true },
    price: "pg/text@1",
  }).build();

  const rows = await db.query(plan);
  const live = await liveStock(shopId); // the stock numbers are Redis's
  return rows.map((r) => ({
    id: r.id,
    // the catalog product this row is (null for a shop's own item). The picker uses it to mark what is already added.
    productId: r.product_id,
    name: r.name,
    brand: r.brand,
    // the pack: "1kg", "5kg", "500g" (null for a shop's own item)
    size: sizeLabel({ quantity: r.quantity, unit: r.pack_unit }),
    category: r.category,
    // how much the shop has, and what it is counted in: 12 "bags"
    stock: live.get(r.id) ?? Number(r.stock),
    unit: r.stock_unit,
    price: Number(r.price),
  }));
}

// Puts catalog products on a shop's shelf in ONE statement, each with the stock the shopkeeper chose. Selling price starts at the catalog's rough cost.
// A product the shop already has is skipped (the shopId + productId pair is unique). Returns how many were really added.
export async function addToInventory(shopId: string, items: { productId: string; stock: number }[]) {
  const plan = db.raw.sql`
    WITH added AS (
      INSERT INTO shop_inventory (id, "shopId", "productId", "sellingPrice", stock, unit, "updatedAt")
      SELECT gen_random_uuid(), ${shopId}::uuid, p.id, coalesce(p.cost, 0), x.stock, 'pcs', now()
      FROM jsonb_to_recordset(${JSON.stringify(items)}::jsonb) AS x("productId" uuid, stock numeric)
      JOIN products p ON p.id = x."productId"
      ON CONFLICT ("shopId", "productId") DO NOTHING
      RETURNING 1
    )
    SELECT count(*)::text AS added FROM added
  `.returnsRow({ added: "pg/text@1" }).build();

  const [row] = await db.query(plan);
  await forgetShelf(shopId); // read again with the new products
  return Number(row?.added ?? 0);
}

// Takes one product off a shop's shelf. The shopId is part of the match, so a shop can only delete its own rows.
export async function removeFromInventory(shopId: string, itemId: string) {
  const gone = await inventory.where({ id: itemId, shopId }).delete();
  await forgetShelf(shopId);
  return gone;
}

// ---- search ----

type Found = { id: string; productId: string | null; name: string; brand: string | null; size: string | null; quantity: string | null; packUnit: string | null; category: string | null; stock: number; unit: string | null; price: number };

// Letters and digits only, so a word can never carry anything odd into the SQL pattern.
function words(text: string) {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 1);
}

// Best matches first: names that start with the search, whole-word hits, shorter names.
function score(row: Found, query: string, found: string[]) {
  const name = row.name.toLowerCase();
  const nameWords = words(name);
  let points = 0;
  if (name.startsWith(query.toLowerCase())) points += 3;
  points += found.filter((w) => nameWords.includes(w)).length;
  if (row.brand) points += 0.5;
  return points - name.length / 100;
}

// Searches ONE shop's inventory for ALL queries with ONE database call, the same way the catalog search works:
// words match as whole words in the name or brand, close spellings count (pg_trgm), and if no item has every word
// the best partial matches come back. An item of the shop's own (no catalog product) is searched by its customName.
export async function searchInventories(shopId: string, queries: string[], limit = 5): Promise<Found[][]> {
  const wordLists = queries.map(words);
  if (!wordLists.some((w) => w.length)) return queries.map(() => []);

  const plan = db.raw.sql`
    SELECT q.idx::int AS idx, s.id, s.product_id, s.name, s.brand, s.quantity, s.pack_unit, s.category, s.stock, s.stock_unit, s.price, s.hits::text AS hits
    FROM jsonb_array_elements(${JSON.stringify(wordLists)}::jsonb) WITH ORDINALITY AS q(wds, idx)
    CROSS JOIN LATERAL (
      SELECT * FROM (
        SELECT i.id::text AS id, i."productId"::text AS product_id, coalesce(p.name, i."customName", 'Item') AS name, p.brand,
          p.quantity::text AS quantity, p.unit AS pack_unit, p.category, i.stock::text AS stock, i.unit AS stock_unit, i."sellingPrice"::text AS price,
          (SELECT coalesce(sum(
              CASE
                WHEN (coalesce(p.name, i."customName", '') || ' ' || coalesce(p.brand, '')) ~* ('[[:<:]]' || w.word || '[[:>:]]') THEN 1
                WHEN strict_word_similarity(w.word, coalesce(p.name, i."customName", '') || ' ' || coalesce(p.brand, '')) >= 0.45
                  THEN strict_word_similarity(w.word, coalesce(p.name, i."customName", '') || ' ' || coalesce(p.brand, ''))
                ELSE 0
              END), 0)
           FROM jsonb_array_elements_text(q.wds) AS w(word)) AS hits
        FROM shop_inventory i
        LEFT JOIN products p ON p.id = i."productId"
        WHERE i."shopId" = ${shopId}::uuid
      ) scored
      WHERE hits > 0
      ORDER BY hits DESC, length(name)
      LIMIT 30
    ) s
  `
    .returnsRow({
      idx: "pg/int4@1",
      id: "pg/text@1",
      product_id: { codecId: "pg/text@1", nullable: true },
      name: "pg/text@1",
      brand: { codecId: "pg/text@1", nullable: true },
      quantity: { codecId: "pg/text@1", nullable: true },
      pack_unit: { codecId: "pg/text@1", nullable: true },
      category: { codecId: "pg/text@1", nullable: true },
      stock: "pg/text@1",
      stock_unit: { codecId: "pg/text@1", nullable: true },
      price: "pg/text@1",
      hits: "pg/text@1",
    })
    .build();
  const live = await liveStock(shopId);
  const all = (await db.query(plan)).map((r) => ({
    idx: r.idx,
    hits: Number(r.hits),
    item: {
      id: r.id,
      productId: r.product_id,
      name: r.name,
      brand: r.brand,
      size: sizeLabel({ quantity: r.quantity, unit: r.pack_unit }),
      quantity: r.quantity,
      packUnit: r.pack_unit,
      category: r.category,
      stock: live.get(r.id) ?? Number(r.stock),
      unit: r.stock_unit,
      price: Number(r.price),
    } as Found,
  }));

  // one list per query, best matches first
  return queries.map((query, i) => {
    const found = wordLists[i];
    const mine = all.filter((r) => r.idx === i + 1);
    const best = Math.max(0, ...mine.map((r) => r.hits)); // keep only the best group
    const rows = mine.filter((r) => r.hits >= best * 0.9).map((r) => r.item);
    return rows.sort((a, b) => score(b, query, found) - score(a, query, found)).slice(0, limit);
  });
}

export async function searchInventory(shopId: string, query: string, limit = 10) {
  return (await searchInventories(shopId, [query], limit))[0];
}
