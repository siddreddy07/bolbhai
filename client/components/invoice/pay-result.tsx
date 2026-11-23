"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

import { Mascot } from "@/components/site/mascot"
import { api } from "@/lib/proxy"

const GO_HOME_AFTER = 8 // seconds

type Receipt = {
  invoiceId: string | null
  customerName: string | null
  amount: number
  transactionId: string | null
  paid: boolean
}

const billNo = (id: string) => id.slice(0, 4).toUpperCase()

/**
 * What the customer sees after Stripe. One big BolBhai line, and the receipt under it when it was paid.
 * Both go back to the home page by themselves.
 */
export function PayResult({
  kind,
  id,
  sessionId,
  demo = false,
}: {
  kind: "success" | "cancel"
  id: string
  sessionId?: string
  /** a made-up paid receipt, to look at the page (development only) */
  demo?: boolean
}) {
  const router = useRouter()
  const box = React.useRef<HTMLElement>(null)
  // undefined: still asking Stripe, null: could not read it
  const [receipt, setReceipt] = React.useState<Receipt | null | undefined>(
    demo
      ? {
          invoiceId: id,
          customerName: "Siddharth",
          amount: 300,
          transactionId: "pi_3Demo1234567890abcdef",
          paid: true,
        }
      : kind === "success" && sessionId
        ? undefined
        : null
  )
  const [problem, setProblem] = React.useState("") // why a success could not be shown

  React.useEffect(() => {
    if (demo || kind !== "success" || !sessionId) return
    api
      .get<Receipt>(`/api/stripe/session/${sessionId}`)
      .then((r) => setReceipt(r.data))
      .catch((e) => {
        setProblem(
          e?.response?.status === 404
            ? "Stripe has no payment with this id."
            : "Could not reach the server."
        )
        setReceipt(null)
      })
  }, [demo, kind, sessionId])

  const ready = receipt !== undefined
  // the receipt must be for THIS bill
  const done = kind === "success" && !!receipt?.paid && receipt.invoiceId === id

  // back to the home page after a few seconds, once there is something to read
  React.useEffect(() => {
    if (!ready) return
    const t = window.setTimeout(() => router.replace("/"), GO_HOME_AFTER * 1000)
    return () => window.clearTimeout(t)
  }, [ready, router])

  useGSAP(
    () => {
      if (!ready) return
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set("[data-bar]", { scaleX: 0 })
        return
      }
      // the line rises word by word, then the small things fade in
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from("[data-word]", { yPercent: 110, duration: 0.6, stagger: 0.08 })
        .from(
          "[data-fade]",
          { y: 12, opacity: 0, duration: 0.4, stagger: 0.08 },
          "-=0.25"
        )
      gsap.fromTo(
        "[data-bar]",
        { scaleX: 1 },
        { scaleX: 0, duration: GO_HOME_AFTER, ease: "none" }
      )
      // the amount counts up
      const amount = box.current?.querySelector<HTMLElement>("[data-amount]")
      if (amount && receipt) {
        const to = { n: 0 }
        gsap.to(to, {
          n: receipt.amount,
          duration: 0.9,
          delay: 0.5,
          ease: "power2.out",
          onUpdate: () => (amount.textContent = `₹${Math.round(to.n)}`),
        })
      }
    },
    { scope: box, dependencies: [ready] }
  )

  if (!ready) return <main className="min-h-svh bg-[#f8f8f3]" />

  // the one line, in BolBhai's voice
  const line = done
    ? "Payment ho gaya, bhai."
    : kind === "success"
      ? "Payment confirm nahi hua."
      : "Payment cancel ho gaya."
  // what is shown under it: the receipt rows when it was paid, else one short sentence
  const rows: [string, string][] = done
    ? [
        ...(receipt?.customerName && receipt.customerName !== "Customer"
          ? ([["Customer", receipt.customerName]] as [string, string][])
          : []),
        ["Bill number", `#${billNo(id)}`],
        ["Transaction id", receipt?.transactionId ?? "-"],
      ]
    : []
  // the reason, so a success that cannot be shown says why
  const why = !sessionId
    ? "This link has no payment in it."
    : problem ||
      (receipt && !receipt.paid
        ? "Stripe says this is not paid yet."
        : "This payment is for another bill.")
  const note =
    kind === "success"
      ? `${why} If money was taken, the bill turns paid in a minute.`
      : `Bill #${billNo(id)}`

  return (
    <main
      ref={box}
      className={`flex min-h-dvh flex-col px-5 pt-5 text-[#10301f] sm:px-12 sm:pt-8 ${
        done
          ? "bg-[#bfe8c4]"
          : kind === "success"
            ? "bg-[#f7e33b]"
            : "bg-[#f25c2a]"
      }`}
    >
      <p className="font-display text-center text-lg font-bold sm:text-xl">
        BolBhai
      </p>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center py-6 text-center">
        <Mascot className="mb-3 h-28 w-auto max-w-none sm:mb-5 sm:h-44" />

        <h1 className="font-display text-[2.4rem] leading-[1.05] font-bold text-balance sm:text-6xl">
          {line.split(" ").map((w, i) => (
            <span
              key={i}
              className="inline-block overflow-hidden pb-[0.12em] align-bottom"
            >
              <span data-word className="inline-block">
                {w}&nbsp;
              </span>
            </span>
          ))}
        </h1>

        {done ? (
          <>
            <p data-fade className="mt-4 text-sm font-semibold opacity-70">
              Amount paid
            </p>
            <p
              data-fade
              data-amount
              className="font-display text-5xl font-bold tabular-nums sm:text-6xl"
            >
              ₹{Math.round(receipt?.amount ?? 0)}
            </p>
            <dl
              data-fade
              className="mt-5 w-full divide-y divide-[#10301f]/15 rounded-2xl bg-[#10301f]/[0.07] px-4 text-left text-base"
            >
              {rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5">
                  <dt className="shrink-0 opacity-60">{k}</dt>
                  <dd className="min-w-0 truncate font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : (
          <p data-fade className="mt-3 text-base opacity-80">
            {note}
          </p>
        )}
      </div>

      <p className="pb-2 text-center text-xs opacity-70">
        Going back to BolBhai…
      </p>
      <div
        className="mb-5 h-1 bg-[#10301f]/15 sm:mb-8"
        aria-hidden="true"
        style={{ marginBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <div data-bar className="h-full origin-left bg-[#10301f]" />
      </div>
    </main>
  )
}
