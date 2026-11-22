import { db } from "../prisma/db.js";

// Gives every product a rough shelf price in rupees (currency INR), in steps of 100.
// It is an estimate from the pack size and the category, not a real price list.
//   size   = the pack in kg (or litres): 500 g -> 0.5, 2 l -> 2, no size -> a small 250 g pack
//   rate   = rupees per kg (or litre) for the category
//   cost   = size x rate, rounded to the nearest 100, at least 100, at most 1000 (2000 for packs of 10 kg or more)
// So 10 kg rice is about 700 and 20 kg rice is 1300.
const plan = db.raw.sql`
  WITH sized AS (
    SELECT id,
      CASE
        WHEN quantity IS NULL THEN 0.25
        WHEN unit = 'g' THEN quantity / 1000
        WHEN unit = 'kg' THEN quantity
        WHEN unit = 'mg' THEN quantity / 1000000
        WHEN unit = 'oz' THEN quantity * 0.02835
        WHEN unit = 'lb' THEN quantity * 0.4536
        WHEN unit = 'ml' THEN quantity / 1000
        WHEN unit = 'l' THEN quantity
        WHEN unit = 'cl' THEN quantity / 100
        WHEN unit = 'fl_oz' THEN quantity * 0.02957
        ELSE 0.25
      END AS size,
      CASE category
        WHEN 'Cereals' THEN 65
        WHEN 'Cooking' THEN 160
        WHEN 'Snacks' THEN 300
        WHEN 'Drinks' THEN 90
        WHEN 'Dairy' THEN 120
        WHEN 'Fruit & veg' THEN 80
        WHEN 'Meat & eggs' THEN 400
        WHEN 'Ready meals' THEN 250
        ELSE 200
      END AS rate
    FROM products
  ),
  done AS (
    UPDATE products p
    SET currency = 'INR',
        cost = least(CASE WHEN s.size >= 10 THEN 2000 ELSE 1000 END, greatest(100, round(s.size * s.rate / 100)::int * 100))
    FROM sized s
    WHERE p.id = s.id
    RETURNING p.cost
  )
  SELECT count(*)::text AS priced FROM done
`.returnsRow({ priced: "pg/text@1" }).build();

const [row] = await db.query(plan);
console.log(`priced ${row?.priced} products`);
await db.close();
