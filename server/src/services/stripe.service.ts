import Stripe from "stripe";
import { env } from "../config/env.js";

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;

// Checks that a webhook really came from Stripe (it signs every call) and gives the event.
export function readWebhook(rawBody: Buffer, signature: string) {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) throw new Error("Stripe is not set up: add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET");
  return stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
}

// What the success page shows about one payment.
export async function readPayment(sessionId: string) {
  if (!stripe) throw new Error("Stripe is not set up: add STRIPE_SECRET_KEY");
  const s = await stripe.checkout.sessions.retrieve(sessionId);
  return {
    invoiceId: s.metadata?.invoiceId ?? null,
    customerName: s.metadata?.customerName ?? null,
    amount: (s.amount_total ?? 0) / 100, // rupees
    transactionId: typeof s.payment_intent === "string" ? s.payment_intent : (s.payment_intent?.id ?? null),
    paid: s.payment_status === "paid",
  };
}

export type PayLine = { name: string; quantity: number; unitPrice: number }; // unitPrice in rupees

// A Stripe payment page for one bill: every item with its quantity and unit price, the total under it,
// the customer's name, and the bill number. After paying, Stripe sends the customer to {CLIENT_URL}/invoice/:id/success.
export async function createPaymentLink(input: { invoiceId: string; customerName: string; items: PayLine[] }) {
  if (!stripe) throw new Error("Stripe is not set up: add STRIPE_SECRET_KEY");

  const total = input.items.reduce((n, l) => n + l.quantity * l.unitPrice, 0);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: input.items.map((l) => ({
      quantity: l.quantity,
      price_data: {
        currency: "inr",
        unit_amount: Math.round(l.unitPrice * 100), // paise
        product_data: { name: l.name },
      },
    })),
    custom_text: { submit: { message: `Bill #${input.invoiceId.slice(0, 4).toUpperCase()} for ${input.customerName}: total ₹${total}` } },
    metadata: { invoiceId: input.invoiceId, customerName: input.customerName },
    client_reference_id: input.invoiceId,
    // {CHECKOUT_SESSION_ID} is filled in by Stripe: the success page uses it to show the receipt
    success_url: `${env.CLIENT_URL}/invoice/${input.invoiceId}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.CLIENT_URL}/invoice/${input.invoiceId}/cancel`,
  });

  return { url: session.url, total, sessionId: session.id };
}
