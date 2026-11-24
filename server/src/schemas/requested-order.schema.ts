
import { z } from "zod";

export const requestedOrderSchema = z.object({
  items: z.array(
    z.object({
      query: z.string().min(1).max(80),
      quantity: z.number().positive().nullable(),
      unit: z.string().nullable(),
    })
  ).max(20), // an empty list is fine: nothing was ordered
});
