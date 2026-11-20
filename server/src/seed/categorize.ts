import { db } from "../prisma/db.js";
import { GROUP_TO_CATEGORY, classify } from "./categories.js";

const BATCH_SIZE = 100;
const products = db.orm.public.products;

// Writes one batch of up to 100 products, and returns how many it handled.
async function runBatch(rows: { id: string; name: string; brand: string | null; category: string | null }[]) {
  await Promise.all(
    rows.map((row) => {
      const category = row.category ? GROUP_TO_CATEGORY[row.category] ?? "Other" : classify(row.name, row.brand);
      return products.where({ id: row.id }).update({ category });
    })
  );
  return rows.length;
}

let done = 0;

// 1) products that came with one of the catalog's own groups: rename it to the short category.
for (const group of Object.keys(GROUP_TO_CATEGORY)) {
  for (;;) {
    const rows = await products.select("id", "name", "brand", "category").where({ category: group }).limit(BATCH_SIZE).all();
    if (!rows.length) break;
    done += await runBatch(rows);
  }
}

// 2) products with no category: work it out from the name and brand.
for (;;) {
  const rows = await products.select("id", "name", "brand", "category").where((p) => p.category.isNull()).limit(BATCH_SIZE).all();
  if (!rows.length) break;
  done += await runBatch(rows);
  if (done % 2000 < BATCH_SIZE) console.log(`${done} products organised...`);
}

console.log(`done, ${done} products organised`);
await db.close();
