import { db } from "../prisma/db.js";
import { sizeLabel } from "./pack-size.js";

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
    stock: Number(r.stock),
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
  return Number(row?.added ?? 0);
}

// Takes one product off a shop's shelf. The shopId is part of the match, so a shop can only delete its own rows.
export async function removeFromInventory(shopId: string, itemId: string) {
  return inventory.where({ id: itemId, shopId }).delete();
}
