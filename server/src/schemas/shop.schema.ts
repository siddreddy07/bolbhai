import { z } from "zod";

export const shopSchema = z.object({
  type: z.enum(["GROCERY", "CAFE"]),
  gstin: z.string().min(1),
  name: z.string().min(1).optional(),
});

// Only the name can change. The GSTIN and type are fixed once the shop exists (strict: sending them is an error).
export const updateShopSchema = z.object({ name: z.string().trim().min(1) }).strict();

export type ShopInput = z.infer<typeof shopSchema>;
export type UpdateShopInput = z.infer<typeof updateShopSchema>;
