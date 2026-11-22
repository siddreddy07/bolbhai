"use client"

import * as React from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

import {
  CompanyShell,
  Marker,
  Wrap,
  reduceMotion,
} from "@/components/site/company/shell"
import { CONTACT_EMAIL } from "@/lib/company"

// The terms, printed as a bill, because that's the one thing shopkeepers read till the end.
const LINES: { item: string; text: string }[] = [
  {
    item: "Using BolBhai",
    text: "Its free. The warranty is also free, so same thing.",
  },
  {
    item: "Your account",
    text: "Dont share your password. If someone makes bills as you, thats your problem.",
  },
  {
    item: "Mistakes",
    text: "The AI can hear wrong. Check the slip before pressing Done. Every time.",
  },
  { item: "Your tax", text: "Your shop, your GST. We only do the adding." },
  {
    item: "Uptime",
    text: "We want 100%. We also want a bike. Neither is happening.",
  },
  {
    item: "Changes",
    text: "We might change these. We wont tell you, who reads them anyway.",
  },
]

export function TermsPage() {
  const root = React.useRef<HTMLDivElement>(null)

  // lines print one by one when the bill scrolls in, then the stamp comes down hard
  useGSAP(
    () => {
      if (reduceMotion()) return
      const q = gsap.utils.selector(root.current)
      const lines = q("[data-line]")
      const stamp = q("[data-stamp]")
      gsap.set(lines, { autoAlpha: 0, y: 10 })
      gsap.set(stamp, { autoAlpha: 0, scale: 2.8, rotation: -28 })
      const bill = root.current?.querySelector("[data-bill]")
      if (!bill) return
      const io = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return
          io.disconnect()
          gsap
            .timeline()
            .to(lines, {
              autoAlpha: 1,
              y: 0,
              duration: 0.4,
              stagger: 0.14,
              ease: "power2.out",
            })
            .to(stamp, {
              autoAlpha: 0.92,
              scale: 1,
              rotation: -12,
              duration: 0.4,
              ease: "back.out(2.4)",
            })
            .fromTo(
              bill,
              { y: 0 },
              { y: 5, duration: 0.07, yoyo: true, repeat: 3, ease: "none" },
              "<0.28"
            )
        },
        { threshold: 0.25 }
      )
      io.observe(bill)
      const failsafe = window.setTimeout(
        () => gsap.to([...lines, ...stamp], { autoAlpha: 1, y: 0, scale: 1 }),
        10000
      )
      return () => {
        io.disconnect()
        window.clearTimeout(failsafe)
      }
    },
    { scope: root }
  )

  return (
    <CompanyShell>
      <div ref={root}>
        <Wrap className="pt-5 sm:pt-12">
          <div data-hero>
            <p className="font-hand text-2xl text-signal sm:text-4xl">Terms</p>
            <h1 className="text-[clamp(2rem,8.5vw,4.4rem)] leading-[1] font-extrabold">
              Terms and conditions. There are none. <Marker>Mostly.</Marker>
            </h1>
            <p className="mt-4 max-w-[44ch] text-[15px] leading-relaxed text-foreground/80 sm:text-lg">
              Nobody reads these, even us. So it’s a bill. You’ll read a bill.
            </p>
          </div>
        </Wrap>

        <Wrap className="mt-8 sm:mt-12">
          <div className="mx-auto max-w-[600px]">
            <div data-bill className="relative">
              <div className="paper paper-grain relative px-4 pt-5 pb-5 shadow-[0_24px_50px_-26px_rgb(0_0_0/0.6)] sm:px-8 sm:pt-8">
                <div className="flex items-start justify-between gap-3 border-b-2 border-dashed border-[#1d2a22]/30 pb-3">
                  <p className="font-hand text-3xl leading-none">BolBhai</p>
                  <p className="text-right font-mono text-[11px] opacity-60">
                    Bill of Terms
                    <br />
                    for: you, probably
                  </p>
                </div>

                <ol className="mt-3 space-y-3">
                  {LINES.map((l) => (
                    <li
                      key={l.item}
                      data-line
                      className="grid grid-cols-[1fr_auto] gap-x-3"
                    >
                      <div>
                        <p className="font-semibold">{l.item}</p>
                        <p className="text-[14px] leading-snug text-[#1d2a22]/80">
                          {l.text}
                        </p>
                      </div>
                      <span className="font-mono text-sm leading-6">₹0</span>
                    </li>
                  ))}
                </ol>

                <div className="relative mt-4 border-t-2 border-dashed border-[#1d2a22]/30 pt-3 pb-9 sm:pb-3">
                  <span
                    data-stamp
                    aria-hidden="true"
                    className="pointer-events-none absolute top-9 right-1 rounded-[4px] border-[3px] border-[#1f7a45] bg-[#fbf8ee]/70 px-2.5 py-0.5 font-sans text-2xl font-black tracking-widest text-[#1f7a45] mix-blend-multiply sm:top-3 sm:right-24 sm:text-3xl"
                  >
                    AGREED
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-mono text-xl font-bold">₹0.00</span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] opacity-60">
                    Paid by: scrolling here.
                  </p>
                </div>
              </div>
              <div aria-hidden="true" className="zig-b paper h-3" />
            </div>
          </div>
        </Wrap>

        <Wrap className="mt-7 mb-14 sm:mb-24">
          <p
            data-rise
            className="mx-auto max-w-[600px] text-sm leading-relaxed text-foreground/60"
          >
            Seriously though: BolBhai comes as it is, with no promise it’s
            always on or always right. Your bills, stock and taxes are your
            responsibility. Any problem,{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-semibold underline underline-offset-4"
            >
              mail us
            </a>{" "}
            first.
          </p>
        </Wrap>
      </div>
    </CompanyShell>
  )
}
