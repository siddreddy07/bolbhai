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
  // the payment id, once it is paid
  transactionId: z.string().trim().min(1).max(100).nullable().optional(),
});

// Editing: send only what changes.
// (the defaults are only for a new bill: when editing, a field that is left out stays as it was)
export const updateInvoiceSchema = z.object({
  items: invoiceSchema.shape.items.optional(),
  payment: z.enum(["PAID", "LEDGER"]).optional(),
  paymentType: z.enum(["CASH", "UPI"]).optional(),
  date: invoiceSchema.shape.date,
  transactionId: invoiceSchema.shape.transactionId,
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;

// The khata list: how many of the newest unpaid bills to send (the totals always cover all of them).
export const unpaidQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(100),
});
