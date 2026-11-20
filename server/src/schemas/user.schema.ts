import { z } from "zod";

export const signupSchema = z.object({
  email: z.email(),
  name: z.string().min(1).optional(),
});

export const updateUserSchema = signupSchema.partial();

export type UserInput = z.infer<typeof signupSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
