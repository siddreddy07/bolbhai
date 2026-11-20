import { z } from "zod";

export const shopSchema = z.object({
  type: z.enum(["GROCERY", "CAFE"]),
  gstin: z.string().min(1),
  name: z.string().min(1).optional(),
});

export const updateShopSchema = shopSchema.partial();

export type ShopInput = z.infer<typeof shopSchema>;
export type UpdateShopInput = z.infer<typeof updateShopSchema>;
