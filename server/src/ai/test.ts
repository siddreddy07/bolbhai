// Run: npm run ai:test -- "I need 1kg sugar"
import { db } from "../prisma/db.js";
import { extractOrder } from "./extract-order.js";
import { modelName } from "./model.js";
import { parseOrder } from "./order.js";

const sentence = process.argv[2] ?? "I need 2kg India Gate basmati rice and 5kg Ashirvad atta";
console.log(`${modelName}: ${sentence}`);

const started = Date.now();
try {
  console.log(
  JSON.stringify(
    await extractOrder(
      "I need 2kg basmati rice and 5kg atta"
    ),
    null,
    2
  )
);
  console.log(`Total time: ${((Date.now() - started) / 1000).toFixed(1)}s`);
} catch (error) {
  console.error("Failed:", error instanceof Error ? error.message : error);
} finally {
  await db.close();
}
