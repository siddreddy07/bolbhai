"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

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
}: {
  kind: "success" | "cancel"
  id: string
  sessionId?: string
}) {
  const router = useRouter()
  const box = React.useRef<HTMLElement>(null)
  // undefined: still asking Stripe, null: could not read it
  const [receipt, setReceipt] = React.useState<Receipt | null | undefined>(
    kind === "success" && sessionId ? undefined : null
  )

  React.useEffect(() => {
    if (kind !== "success" || !sessionId) return
    api
      .get<Receipt>(`/api/stripe/session/${sessionId}`)
      .then((r) => setReceipt(r.data))
      .catch(() => setReceipt(null))
  }, [kind, sessionId])

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
    ? "Paisa aa gaya, bhai."
    : kind === "success"
      ? "Pata nahi chala, bhai."
      : `Bill #${billNo(id)} cancel. Kanjoosi, bhai?`
  const small = done
    ? [receipt?.customerName, `Bill #${billNo(id)}`, receipt?.transactionId]
    : kind === "success"
      ? ["Paisa kata ho toh bill thodi der mein paid ho jayega."]
      : ["Koi paisa nahi kata."]

  return (
    <main
      ref={box}
      className={`relative flex min-h-svh flex-col justify-between px-6 py-6 text-[#10301f] sm:px-12 sm:py-10 ${
        done
          ? "bg-[#bfe8c4]"
          : kind === "success"
            ? "bg-[#f7e33b]"
            : "bg-[#f25c2a]"
      }`}
    >
      <p className="font-display text-xl font-bold">BolBhai</p>

      <div>
        <h1 className="font-display text-5xl leading-[1.02] font-bold sm:text-7xl md:text-8xl">
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

        {done && (
          <p
            data-fade
            data-amount
            className="font-display mt-6 text-4xl font-bold tabular-nums sm:text-5xl"
          >
            ₹{Math.round(receipt?.amount ?? 0)}
          </p>
        )}
        <p data-fade className="mt-3 max-w-md text-sm break-all opacity-75">
          {small.filter(Boolean).join(" · ")}
        </p>
      </div>

      <div className="h-1 bg-[#10301f]/15" aria-hidden="true">
        <div data-bar className="h-full origin-left bg-[#10301f]" />
      </div>
    </main>
  )
}
