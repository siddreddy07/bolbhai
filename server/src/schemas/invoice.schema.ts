import { z } from "zod";

// One line of a bill: the product (its id in the products table) and how many.
const lineSchema = z.object({
  pid: z.uuid(),
  quantity: z.number().positive().max(1_000_000),
});

export const invoiceSchema = z.object({
  items: z.array(lineSchema).min(1).max(200),
  // settled (PAID) or written in the ledger to be paid later (LEDGER); and how it was paid
  payment: z.enum(["PAID", "LEDGER"]).default("PAID"),
  paymentType: z.enum(["CASH", "UPI"]).default("CASH"),
  // when the bill was made (leave it out for "now")
  date: z.iso.datetime().optional(),
});

// Editing: send only what changes.
// (the defaults are only for a new bill: when editing, a field that is left out stays as it was)
export const updateInvoiceSchema = z.object({
  items: invoiceSchema.shape.items.optional(),
  payment: z.enum(["PAID", "LEDGER"]).optional(),
  paymentType: z.enum(["CASH", "UPI"]).optional(),
  date: invoiceSchema.shape.date,
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;

// The bills list: one day (YYYY-MM-DD), or the bills whose number starts with `q`, or only the unpaid ones.
// With none of them, it is today.
export const listQuerySchema = z.object({
  day: z.iso.date().optional(),
  q: z.string().regex(/^[0-9a-fA-F-]{1,36}$/).optional(),
  unpaid: z.enum(["1", "true"]).optional(),
});

// The khata list: how many of the newest unpaid bills to send (the totals always cover all of them).
export const unpaidQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(100),
});
