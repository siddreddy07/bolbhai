import { Output, generateText, isStepCount } from "ai";
import { AI_SYSTEM_PROMPT } from "../config/constant.js";
import { orderSchema } from "../schemas/order.schema.js";
import { pickOptions } from "../services/pack-size.js";
import { aiOptions, getModel } from "./model.js";
import { searchProductsTool } from "./tools/search-products.tool.js";

// "2kg basmati rice and 5kg atta"  ->  an order with items and totals.
export async function parseOrder(text: string) {
  // Call 1: the AI uses the search tool to find the products.
  const search = await generateText({
    model: getModel(),
    system: AI_SYSTEM_PROMPT,
    prompt: text,
    tools: { search_products: searchProductsTool },
    stopWhen: isStepCount(3),
    providerOptions: aiOptions,
  });
  const found = search.steps.flatMap((step) => step.toolResults.map((r) => r.output));
  const searches = found.flat() as { query: string; matches: Parameters<typeof pickOptions>[0] }[]; // one entry per searched item

  // Call 2: no tools, only fill the order. (Small local models hang if tools and JSON are mixed.)
  const { output } = await generateText({
    model: getModel(),
    system: AI_SYSTEM_PROMPT,
    prompt: `Shopkeeper said: ${text}

Catalog search results:
${JSON.stringify(searches.map((s) => ({ query: s.query, matches: s.matches.slice(0, 5) })))}`,
    output: Output.object({ schema: orderSchema }),
    providerOptions: aiOptions,
  });

  // The maths is done here, never by the AI.
  const items = output.items.map((item) => ({
    ...item,
    // Other packs of this item that make sense for the amount asked (not a 25kg pack for 2kg).
    options: pickOptions(searches.find((s) => s.query === item.query)?.matches ?? [], item.quantity, item.unit),
    total: item.price === null ? null : item.price * item.quantity,
  }));

  const priced = items.filter((item) => item.total !== null);
  const total = priced.length ? priced.reduce((sum, item) => sum + item.total!, 0) : null;

  return { items, total, ask: output.ask };
}
