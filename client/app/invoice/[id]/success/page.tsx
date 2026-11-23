import { PayResult } from "@/components/invoice/pay-result"

// Stripe sends the customer here after paying. The bill is marked paid on the server (when this page asks for the receipt, and by Stripe's webhook).
// In development, add ?preview=1 to see the paid screen with made-up details.
export default async function PaidPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ session_id?: string; preview?: string }>
}) {
  const { id } = await params
  const { session_id, preview } = await searchParams
  return (
    <PayResult
      kind="success"
      id={id}
      sessionId={session_id}
      demo={!!preview && process.env.NODE_ENV !== "production"}
    />
  )
}
