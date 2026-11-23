import { PayResult } from "@/components/invoice/pay-result"

// Stripe sends the customer here when they leave the payment page without paying.
export default async function CancelledPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <PayResult kind="cancel" id={id} />
}
