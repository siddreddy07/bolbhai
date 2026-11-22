
import { z } from "zod";

export const requestedOrderSchema = z.object({
  items: z.array(
    z.object({
      query: z.string().min(1),
      quantity: z.number().positive().nullable(),
      unit: z.string().nullable(),
    })
  ).min(1),
});
