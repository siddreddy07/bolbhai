import { z } from "zod";

// What the AI returns for "2kg basmati rice and 5kg atta".
export const orderSchema = z.object({
  items: z.array(
    z.object({
      requested: z.string().describe("The item name only, like 'basmati rice' (no amount)"),
      query: z.string().nullable().describe("The exact query you used in search_products for this item"),
      product: z.string().nullable().describe("Best catalog match, or null"),
      barcode: z.string().nullable(),
      quantity: z.number(),
      unit: z.string().nullable(),
      price: z.number().nullable().describe("Rupees per unit, only if the shopkeeper said it"),
    })
  ),
  ask: z.string().nullable().describe("A short question if something is unclear, otherwise null"),
});

export type OrderOutput = z.infer<typeof orderSchema>;
