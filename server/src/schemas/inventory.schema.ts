import { z } from "zod";

// The catalog products a shopkeeper picked to put on the shelf.
// Each one comes with how many the shop has right now (0 is fine: the stock can be raised later).
export const addInventorySchema = z.object({
  items: z
    .array(z.object({ productId: z.uuid(), stock: z.number().min(0).max(1_000_000) }))
    .min(1)
    .max(100),
});

export const searchSchema = z.object({
  q: z.string().trim().min(2).max(60),
});
