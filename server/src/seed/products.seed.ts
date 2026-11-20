import { createReadStream } from "node:fs";
import { parse } from "csv-parse";
import { db } from "../prisma/db.js";

const BATCH_SIZE = 1000;
const products = db.orm.public.products;

// Empty and "unknown" both mean "we don't know".
function clean(value?: string) {
  const text = value?.trim();
  return text && text !== "unknown" ? text : null;
}

function toProduct(row: Record<string, string>) {
  const name = clean(row.product_name);
  if (!name) return null; // a product without a name is no use to a shopkeeper

  const amount = Number(row.quantity_amount);
  const hasQuantity = Number.isFinite(amount) && amount > 0;

  return {
    barcode: row.code.trim(),
    name,
    brand: clean(row.brands),
    quantity: hasQuantity ? String(amount) : null,
    unit: hasQuantity ? clean(row.quantity_unit)?.toLowerCase() ?? null : null,
    category: clean(row.pnns_groups_1),
    subcategory: clean(row.pnns_groups_2),
  };
}

async function seed(file: string) {
  if (await products.first()) {
    console.log("products table already has data, nothing to do");
    return;
  }

  let batch: NonNullable<ReturnType<typeof toProduct>>[] = [];
  let saved = 0;
  let skipped = 0;

  for await (const row of createReadStream(file).pipe(parse({ columns: true, bom: true }))) {
    const product = toProduct(row);
    if (!product) {
      skipped++;
      continue;
    }
    batch.push(product);

    if (batch.length === BATCH_SIZE) {
      saved += await products.createAndCount(batch);
      batch = [];
    }
  }
  if (batch.length) {
    saved += await products.createAndCount(batch);
  }

  console.log(`saved ${saved} products, skipped ${skipped} rows without a name`);
}

const file = process.argv[2];
if (!file) {
  console.error("Usage: npm run db:seed -- <path to products csv>");
  process.exit(1);
}

await seed(file);
await db.close();
