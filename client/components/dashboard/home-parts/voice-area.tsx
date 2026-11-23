"use client"

import * as React from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CustomerPick } from "@/components/dashboard/bills/customer-pick"
import { LISTENING } from "@/lib/copy"
import { useHomeStore } from "@/store/home-store"
import { cn } from "@/lib/utils"

/** What the voice just did: the words coming in, then the slip with the items it found. */
export function VoiceArea() {
  const {
    phase,
    transcript,
    setTranscript,
    order,
    finding,
    orderError,
    findItems,
    caption,
    dismiss,
    pickMatch,
    saveOrderAsBill,
    savingBill,
    draftPayment,
    draftPaymentType,
    setDraftPayment,
    draftCustomer,
    setDraftCustomer,
  } = useHomeStore()
  const root = React.useRef<HTMLElement>(null)
  const phrase = LISTENING.split(" ")

  // each phase gets its own little moment
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      const q = gsap.utils.selector(root.current)
      if (phase === "listening") {
        gsap.from(q("[data-word]"), {
          y: 14,
          autoAlpha: 0,
          duration: 0.45,
          stagger: 0.18,
          delay: 0.25,
          ease: "power3.out",
        })
      }
      if (phase === "confirm") {
        // the bill prints out, top to bottom
        gsap.fromTo(
          q("[data-slip]"),
          { clipPath: "inset(0 0 100% 0)", y: -16 },
          {
            clipPath: "inset(0 0 0% 0)",
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            clearProps: "clipPath,transform",
          }
        )
        gsap.from(q("[data-slip] [data-line]"), {
          autoAlpha: 0,
          y: 8,
          duration: 0.4,
          stagger: 0.12,
          delay: 0.25,
        })
      }
    },
    { dependencies: [phase], scope: root }
  )

  return (
    <section
      ref={root}
      aria-live="polite"
      className={cn(
        "relative flex items-center justify-center",
        phase === "idle" ? "h-0" : "min-h-0 flex-1 py-2"
      )}
    >
      {phase === "listening" && (
        <p
          className={cn(
            "max-w-[24ch] text-center text-xl leading-snug font-bold sm:text-2xl md:[@media(min-height:900px)]:text-4xl"
          )}
        >
          {caption
            ? `“${caption}”`
            : phrase.map((w, i) => (
                <span key={i} data-word className="inline-block">
                  {w}&nbsp;
                </span>
              ))}
        </p>
      )}

      {phase === "thinking" && (
        <p className="animate-pulse font-hand text-3xl">
          Got it. Writing it down…
        </p>
      )}

      {phase === "confirm" && (
        <div className="relative z-10 flex w-full max-w-[340px] flex-col gap-3">
          <div
            data-slip
            className="relative bg-[#fffef8] [mask-image:conic-gradient(from_-45deg_at_bottom,#0000,#000_1deg_89deg,#0000_90deg)] [mask-size:16px_100%] [mask-position:50%] px-5 pt-4 pb-6 text-[#10301f] shadow-[0_18px_40px_-18px_rgb(0_0_0/0.7)]"
          >
            <textarea
              data-line
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={2}
              placeholder="Type it here, like 1 kg sugar"
              aria-label="What you said. Tap to fix it or type."
              className="mb-2 w-full resize-none rounded-lg border border-dashed border-[#10301f]/30 bg-transparent px-2 py-1.5 text-base leading-snug outline-none focus:border-[#10301f] focus:bg-white/60"
            />
            <p data-line className="font-hand text-2xl leading-none opacity-70">
              Your order
              {draftCustomer ? ` · for ${draftCustomer.name}` : ""}
            </p>
            {order?.length ? (
              <ul
                data-line
                className="max-h-[38dvh] overflow-y-auto overscroll-contain border-b border-dashed border-[#10301f]/30 pb-2 text-sm"
              >
                {order.map((line) => (
                  <li key={line.query} className="py-1">
                    <span className="font-bold">
                      {line.quantity} {line.unit} {line.query}
                    </span>
                    {line.matches.length ? (
                      <span
                        role="radiogroup"
                        aria-label={`Which ${line.query}`}
                        className="mt-1 flex flex-wrap gap-1"
                      >
                        {line.matches.slice(0, 4).map((m, i) => (
                          <button
                            key={m.id}
                            type="button"
                            role="radio"
                            aria-checked={line.pick === i}
                            onClick={() => pickMatch(line.query, i)}
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
                              line.pick === i
                                ? "border-[#10301f] bg-[#10301f] text-[#f8f8f3]"
                                : "border-[#10301f]/25 hover:bg-[#10301f]/10"
                            )}
                          >
                            {m.name}
                            {m.size ? ` ${m.size}` : ""} · ₹{m.price}
                          </button>
                        ))}
                      </span>
                    ) : (
                      <span className="block text-xs opacity-60">
                        not on your shelf
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p
                data-line
                className="border-b border-dashed border-[#10301f]/30 pb-2 text-sm opacity-70"
              >
                Tap Confirm to find the items.
              </p>
            )}
            {order?.length ? (
              <div data-line className="mt-3 grid gap-1.5">
                <CustomerPick
                  value={draftCustomer}
                  onChange={setDraftCustomer}
                />
                <div
                  role="radiogroup"
                  aria-label="Payment"
                  className="grid grid-cols-2 gap-1.5"
                >
                  {(["PAID", "LEDGER"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      role="radio"
                      aria-checked={draftPayment === p}
                      onClick={() => setDraftPayment(p, draftPaymentType)}
                      className={cn(
                        "h-9 rounded-full border text-sm font-semibold transition-colors",
                        draftPayment === p
                          ? "border-[#10301f] bg-[#10301f] text-[#f8f8f3]"
                          : "border-[#10301f]/25 hover:bg-[#10301f]/10"
                      )}
                    >
                      {p === "PAID" ? "Paid" : "Not paid"}
                    </button>
                  ))}
                </div>
                <div
                  role="radiogroup"
                  aria-label="Payment type"
                  className="grid grid-cols-2 gap-1.5"
                >
                  {(["CASH", "UPI"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={draftPaymentType === t}
                      onClick={() => setDraftPayment(draftPayment, t)}
                      className={cn(
                        "h-9 rounded-full border text-sm font-semibold transition-colors",
                        draftPaymentType === t
                          ? "border-[#10301f] bg-[#10301f] text-[#f8f8f3]"
                          : "border-[#10301f]/25 hover:bg-[#10301f]/10"
                      )}
                    >
                      {t === "CASH" ? "Cash" : "UPI"}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {orderError && (
              <p className="mt-2 text-sm font-semibold text-signal">
                {orderError}
              </p>
            )}
          </div>

          {/* the buttons sit outside the torn paper, so nothing can cover or clip them */}
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Button
              onClick={order ? () => saveOrderAsBill() : findItems}
              disabled={
                finding ||
                savingBill ||
                (!order && !transcript.trim()) ||
                (!!order && !order.some((l) => l.matches.length))
              }
              className="h-12 rounded-full text-base"
            >
              <Check className="size-5" />{" "}
              {finding
                ? "Finding items…"
                : savingBill
                  ? "Saving…"
                  : order
                    ? "Done"
                    : "Confirm"}
            </Button>
            <Button
              onClick={dismiss}
              variant="outline"
              className="h-12 rounded-full px-5 text-base"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
