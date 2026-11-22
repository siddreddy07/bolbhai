import { db } from "../prisma/db.js";

type Row = { id: string; cost: string | null; name: string; brand: string | null; quantity: string; unit: string | null; category: string | null; barcode: string };

// Letters and digits only, so a word can never carry anything odd into the SQL pattern.
function words(text: string) {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 1);
}

// Best matches first: names that start with the search, whole-word hits, shorter names.
function score(row: Row, query: string, found: string[]) {
  const name = row.name.toLowerCase();
  const nameWords = words(name);
  let points = 0;
  if (name.startsWith(query.toLowerCase())) points += 3;
  points += found.filter((w) => nameWords.includes(w)).length;
  if (row.brand) points += 0.5;
  return points - name.length / 100;
}

// Finds products for ALL queries with ONE database call, however many items there are.
// Words match as WHOLE words in the name or brand ("atta" matches "Chakki Atta", not "Khatta Meetha").
// Close spellings count too (pg_trgm), and if no product has every word the best partial matches are returned.
// Products without a size are skipped.
export async function searchProducts(queries: string[], limit = 5): Promise<Row[][]> {
  const wordLists = queries.map(words);
  if (!wordLists.some((w) => w.length)) return queries.map(() => []);

  // For every product, "hits" adds up one score per query word:
  //   1    = the word is in the name or brand as a whole word ("atta" in "Chakki Atta")
  //   0.45 to 1 = a close spelling (pg_trgm), so "ashirvad" still finds "Aashirvaad"
  //   0    = no match
  // Products with the highest hits come first, so a full match beats a partial one.
  const plan = db.raw.sql`
    SELECT q.idx::int AS idx, p.id::text AS id, p.cost::text AS cost, p.name, p.brand, p.quantity::text AS quantity, p.unit, p.category, p.barcode, p.hits::text AS hits
    FROM jsonb_array_elements(${JSON.stringify(wordLists)}::jsonb) WITH ORDINALITY AS q(wds, idx)
    CROSS JOIN LATERAL (
      SELECT * FROM (
        SELECT id, cost, name, brand, quantity, unit, category, barcode,
          (SELECT coalesce(sum(
              CASE
                WHEN (products.name || ' ' || coalesce(products.brand, '')) ~* ('[[:<:]]' || w.word || '[[:>:]]') THEN 1
                WHEN strict_word_similarity(w.word, products.name || ' ' || coalesce(products.brand, '')) >= 0.45
                  THEN strict_word_similarity(w.word, products.name || ' ' || coalesce(products.brand, ''))
                ELSE 0
              END), 0)
           FROM jsonb_array_elements_text(q.wds) AS w(word)) AS hits
        FROM products
        WHERE quantity IS NOT NULL
      ) scored
      WHERE hits > 0
      ORDER BY hits DESC, length(name)
      LIMIT 30
    ) p
  `
    .returnsRow({
      idx: "pg/int4@1",
      id: "pg/text@1",
      cost: { codecId: "pg/text@1", nullable: true },
      name: "pg/text@1",
      brand: { codecId: "pg/text@1", nullable: true },
      quantity: "pg/text@1",
      unit: { codecId: "pg/text@1", nullable: true },
      category: { codecId: "pg/text@1", nullable: true },
      barcode: "pg/text@1",
      hits: "pg/text@1",
    })
    .build();
  const all = (await db.query(plan)).map((r) => ({ ...r, hits: Number(r.hits) }));

  // Split the rows back into one list per query, best matches first.
  return queries.map((query, i) => {
    const found = wordLists[i];
    const mine = all.filter((r) => r.idx === i + 1);
    // Keep only the best group: all words if some product has them all, else the next best.
    const best = Math.max(0, ...mine.map((r) => r.hits));
    const rows = mine.filter((r) => r.hits >= best * 0.9).map((r) => r as Row);
    return rows.sort((a, b) => score(b, query, found) - score(a, query, found)).slice(0, limit);
  });
}

export async function searchProduct(query: string, limit = 5) {
  return (await searchProducts([query], limit))[0];
}
