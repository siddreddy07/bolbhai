import { z } from "zod";
import { isAllowedEmail } from "../config/email-domains.js";

export const signupSchema = z.object({
  email: z.email().refine(isAllowedEmail, "Use a Gmail, Outlook, Hotmail, Yahoo, iCloud or Proton email"),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const updateUserSchema = signupSchema.omit({ password: true }).partial();

export type UserInput = z.infer<typeof signupSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
