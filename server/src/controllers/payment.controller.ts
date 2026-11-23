import type { Request, Response } from "express";
import { ownsShop } from "../middleware/auth.middleware.js";
import { idSchema } from "../schemas/id.schema.js";
import { getInvoice, updateInvoice } from "../services/invoice.service.js";
import { getInventory } from "../services/inventory.service.js";
import { getCustomer, saveTransaction } from "../services/customer.service.js";
import { createPaymentLink, readPayment, readWebhook } from "../services/stripe.service.js";

// POST /api/invoices/:id/pay-link  ->  { url, total }: the Stripe page to send the customer to for this bill
export async function payLink(req: Request, res: Response) {
  try {
    const id = idSchema.safeParse(req.params.id);
    if (!id.success) return res.status(400).json({ message: "Invalid id" });
    const invoice = await getInvoice(id.data);
    if (!invoice || !ownsShop(req, invoice.shopId))
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

// A payment that Stripe says is paid: save it with the bill and the customer on it, and mark the bill paid.
// Safe to run twice (the success page AND the webhook both call it): the transaction is saved once.
async function settle(p: { invoiceId: string | null; transactionId: string | null; amount: number }) {
  const invoice = p.invoiceId ? await getInvoice(p.invoiceId) : null;
  if (!invoice || !p.transactionId) return;
  await saveTransaction({
    shopId: invoice.shopId,
    invoiceId: invoice.id,
    customerId: invoice.customerId,
    transactionId: p.transactionId,
    subtotal: p.amount,
  });
  if (invoice.payment !== "PAID") await updateInvoice(invoice.id, { payment: "PAID", paymentType: "UPI" });
}

// GET /api/stripe/session/:sessionId (no login: the customer who just paid opens it).
// The receipt for the success page. What it says comes from Stripe itself, so a paid one is saved right here too:
// the bill turns paid even when the webhook is not connected (like on your own computer).
export async function paymentReceipt(req: Request, res: Response) {
  try {
    const receipt = await readPayment(String(req.params.sessionId));
    if (receipt.paid)
      await settle(receipt).catch((e) => console.error("Could not save the payment:", e)); // still show the receipt
    res.json(receipt);
  } catch {
    res.status(404).json({ message: "Payment not found" });
  }
}

// POST /api/stripe/webhook: Stripe tells us a payment went through (the safety net when the customer closes the page early).
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
      const payment = session.payment_intent;
      await settle({
        invoiceId: session.metadata?.invoiceId ?? null,
        transactionId: typeof payment === "string" ? payment : (payment?.id ?? session.id),
        amount: (session.amount_total ?? 0) / 100,
      });
    }
    res.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook failed:", error);
    res.status(500).json({ message: "Webhook failed" }); // Stripe tries again later
  }
}
