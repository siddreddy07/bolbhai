import { tool } from "ai";
import { z } from "zod";
import { searchProducts } from "../../services/product.service.js";

// The one tool the model can call: look up every item the shopkeeper asked for, in one go.
export const searchProductsTool = tool({
  description:
    "Search the product catalog for every item the shopkeeper asked for. Pass all items in one call. " +
    "Query = brand (if the shopkeeper said one) + product words, like 'india gate basmati rice'. Never include the amount wanted.",
  inputSchema: z.object({
    items: z.array(z.object({ query: z.string().describe("Brand (if said) and product, for example 'india gate basmati rice'") })).min(1),
  }),
  execute: async ({ items }) => {
    console.log('Search Products Tool Called :',items)
    const results = await searchProducts(items.map((i) => i.query), 12);
    return items.map((item, i) => ({ query: item.query, matches: results[i] }));
  },
});
