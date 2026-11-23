import type { Request, Response } from "express";
import { idSchema } from "../schemas/id.schema.js";
import { getInvoice, updateInvoice } from "../services/invoice.service.js";
import { getInventory } from "../services/inventory.service.js";
import { getCustomer, saveTransaction } from "../services/customer.service.js";
import { getShopById } from "../services/shop.service.js";
import { createPaymentLink, readPayment, readWebhook } from "../services/stripe.service.js";

// POST /api/invoices/:id/pay-link  ->  { url, total }: the Stripe page to send the customer to for this bill
export async function payLink(req: Request, res: Response) {
  try {
    const id = idSchema.safeParse(req.params.id);
    if (!id.success) return res.status(400).json({ message: "Invalid id" });
    const invoice = await getInvoice(id.data);
    if (!invoice || !(await getShopById(invoice.shopId, req.user!.id)))
      return res.status(404).json({ message: "Invoice not found" });
    if (invoice.payment === "PAID") return res.status(409).json({ message: "This bill is already paid" });

    // each line's name and unit price come from the shop's inventory
    const shelf = await getInventory(invoice.shopId);
    const items = invoice.items.map((l) => {
      const item = shelf.find((s) => s.productId === l.pid);
      return {
        name: item ? [item.brand, item.name, item.size].filter(Boolean).join(" ") : "Item",
        quantity: l.quantity,
        unitPrice: item?.price ?? 0,
      };
    });
    const customer = invoice.customerId ? await getCustomer(invoice.customerId) : null;

    const { url, total } = await createPaymentLink({
      invoiceId: invoice.id,
      customerName: customer?.name ?? "Customer",
      items,
    });
    res.json({ url, total });
  } catch (error) {
    console.error("Could not make the payment link:", error);
    res.status(500).json({ message: "Could not make the payment link" });
  }
}

// GET /api/stripe/session/:sessionId (no login: the customer who just paid opens it). The receipt for the success page.
export async function paymentReceipt(req: Request, res: Response) {
  try {
    res.json(await readPayment(String(req.params.sessionId)));
  } catch {
    res.status(404).json({ message: "Payment not found" });
  }
}

// POST /api/stripe/webhook: Stripe tells us a payment went through. This, not the success page, marks the bill paid.
export async function stripeWebhook(req: Request, res: Response) {
  let event;
  try {
    event = readWebhook(req.body as Buffer, String(req.headers["stripe-signature"] ?? ""));
  } catch {
    return res.status(400).json({ message: "Bad signature" });
  }
  try {
    if (event.type === "checkout.session.completed" && event.data.object.payment_status === "paid") {
      const session = event.data.object;
      const invoiceId = session.metadata?.invoiceId;
      const invoice = invoiceId ? await getInvoice(invoiceId) : null;
      if (invoice) {
        const payment = session.payment_intent;
        // the payment is saved with the bill, the customer on it and Stripe's transaction id
        await saveTransaction({
          shopId: invoice.shopId,
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          transactionId: typeof payment === "string" ? payment : (payment?.id ?? session.id),
          subtotal: (session.amount_total ?? 0) / 100,
        });
        if (invoice.payment !== "PAID") await updateInvoice(invoice.id, { payment: "PAID", paymentType: "UPI" });
      }
    }
    res.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook failed:", error);
    res.status(500).json({ message: "Webhook failed" }); // Stripe tries again later
  }
}
