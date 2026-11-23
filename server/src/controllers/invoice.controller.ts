import type { Request, Response } from "express";
import { z } from "zod";
import { idSchema } from "../schemas/id.schema.js";
import {
  invoiceSchema,
  unpaidQuerySchema,
  updateInvoiceSchema,
} from "../schemas/invoice.schema.js";
import {
  createInvoice,
  deleteInvoice,
  getInvoice,
  getInvoices,
  getUnpaidInvoices,
  isLocked,
  updateInvoice,
} from "../services/invoice.service.js";
import { getAnalytics } from "../services/analytics.service.js";
import { getShopById } from "../services/shop.service.js";

// An invoice belongs to a shop, and a shop to its owner: only the owner may touch it.
// Gives the invoice, or answers the error itself and gives nothing.
async function ownInvoice(req: Request, res: Response) {
  const id = idSchema.safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ message: "Invalid id" });
    return null;
  }
  const invoice = await getInvoice(id.data);
  if (!invoice || !(await getShopById(invoice.shopId, req.user!.id))) {
    res.status(404).json({ message: "Invoice not found" });
    return null;
  }
  return invoice;
}

// GET /api/invoices/shop/:shopId   every invoice of this shop, newest first
export async function listInvoices(req: Request, res: Response) {
  try {
    const shopId = idSchema.safeParse(req.params.shopId);
    if (!shopId.success) return res.status(400).json({ message: "Invalid id" });
    if (!(await getShopById(shopId.data, req.user!.id)))
      return res.status(404).json({ message: "Shop not found" });
    res.json(await getInvoices(shopId.data));
  } catch (error) {
    console.error("Could not list invoices:", error);
    res.status(500).json({ message: "Could not get invoices" });
  }
}

// GET /api/invoices/shop/:shopId/unpaid?limit=100   the khata: this shop's unpaid (ledger) bills, newest first, with totals
export async function listUnpaid(req: Request, res: Response) {
  try {
    const shopId = idSchema.safeParse(req.params.shopId);
    const query = unpaidQuerySchema.safeParse(req.query);
    if (!shopId.success || !query.success)
      return res.status(400).json({ message: "Invalid request" });
    if (!(await getShopById(shopId.data, req.user!.id)))
      return res.status(404).json({ message: "Shop not found" });
    res.json(await getUnpaidInvoices(shopId.data, query.data.limit));
  } catch (error) {
    console.error("Could not list unpaid invoices:", error);
    res.status(500).json({ message: "Could not get the unpaid bills" });
  }
}

// GET /api/invoices/shop/:shopId/analytics   sales for today, this week and this month in one response
export async function readAnalytics(req: Request, res: Response) {
  try {
    const shopId = idSchema.safeParse(req.params.shopId);
    if (!shopId.success)
      return res.status(400).json({ message: "Invalid request" });
    if (!(await getShopById(shopId.data, req.user!.id)))
      return res.status(404).json({ message: "Shop not found" });
    res.json(await getAnalytics(shopId.data));
  } catch (error) {
    console.error("Could not get the analytics:", error);
    res.status(500).json({ message: "Could not get the analytics" });
  }
}

// POST /api/invoices/shop/:shopId   body = { items: [{ pid, quantity }], date?, transactionId? }
export async function addInvoice(req: Request, res: Response) {
  try {
    const shopId = idSchema.safeParse(req.params.shopId);
    if (!shopId.success) return res.status(400).json({ message: "Invalid id" });
    const body = invoiceSchema.safeParse(req.body);
    if (!body.success)
      return res.status(400).json({ message: z.prettifyError(body.error) });

    if (!(await getShopById(shopId.data, req.user!.id)))
      return res.status(404).json({ message: "Shop not found" });
    // the new bill, and the stock of its products now (the shelf moved with it)
    const { invoice, stock } = await createInvoice(shopId.data, body.data);
    res.status(201).json({ ...invoice, stock });
  } catch (error) {
    console.error("Could not create invoice:", error);
    res.status(500).json({ message: "Could not create the invoice" });
  }
}

// GET /api/invoices/:id
export async function readInvoice(req: Request, res: Response) {
  try {
    const invoice = await ownInvoice(req, res);
    if (invoice) res.json(invoice);
  } catch (error) {
    console.error("Could not get invoice:", error);
    res.status(500).json({ message: "Could not get the invoice" });
  }
}

// PUT /api/invoices/:id   body = any of { items, date, transactionId }
export async function editInvoice(req: Request, res: Response) {
  try {
    const body = updateInvoiceSchema.safeParse(req.body);
    if (!body.success)
      return res.status(400).json({ message: z.prettifyError(body.error) });

    const invoice = await ownInvoice(req, res);
    if (!invoice) return;
    // paid bills never change; unpaid ones only for 24 hours. (Marking one paid is still fine.)
    if (body.data.items && isLocked(invoice))
      return res.status(403).json({
        message: invoice.payment === "PAID"
          ? "A paid bill cannot be edited"
          : "A bill cannot be edited after 24 hours",
      });
    const saved = await updateInvoice(invoice.id, body.data);
    if (!saved) return res.status(404).json({ message: "Invoice not found" });
    res.json({ ...saved.invoice, stock: saved.stock });
  } catch (error) {
    console.error("Could not update invoice:", error);
    res.status(500).json({ message: "Could not update the invoice" });
  }
}

// DELETE /api/invoices/:id
export async function removeInvoice(req: Request, res: Response) {
  try {
    const invoice = await ownInvoice(req, res);
    if (!invoice) return;
    const gone = await deleteInvoice(invoice.id);
    if (!gone) return res.status(404).json({ message: "Invoice not found" });
    res.json({ message: "Invoice deleted", stock: gone.stock });
  } catch (error) {
    console.error("Could not delete invoice:", error);
    res.status(500).json({ message: "Could not delete the invoice" });
  }
}
