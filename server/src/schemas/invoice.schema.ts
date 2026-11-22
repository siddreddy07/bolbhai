import { z } from "zod";

// One line of a bill: the product (its id in the products table) and how many.
const lineSchema = z.object({
  pid: z.uuid(),
  quantity: z.number().positive().max(1_000_000),
});

export const invoiceSchema = z.object({
  items: z.array(lineSchema).min(1).max(200),
  // when the bill was made (leave it out for "now")
  date: z.iso.datetime().optional(),
  // the payment id, once it is paid
  transactionId: z.string().trim().min(1).max(100).nullable().optional(),
});

// Editing: send only what changes.
export const updateInvoiceSchema = invoiceSchema.partial();

export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
