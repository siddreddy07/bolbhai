import { PayResult } from "@/components/invoice/pay-result"

// Stripe sends the customer here after paying. The bill is marked paid by Stripe's webhook on the server, not by this page.
export default async function PaidPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ session_id?: string }>
}) {
  const { id } = await params
  const { session_id } = await searchParams
  return <PayResult kind="success" id={id} sessionId={session_id} />
}
