"use client"

import * as React from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

import {
  CompanyShell,
  Wrap,
  reduceMotion,
} from "@/components/site/company/shell"
import { CONTACT_EMAIL } from "@/lib/company"

// What we keep and who sees it. Every row is true of the app as it is built.
const ROWS: { what: string; detail: string; who: string }[] = [
  {
    what: "Your account",
    detail:
      "Name, email and password. The password is saved scrambled, so even we can’t read it.",
    who: "only you",
  },
  {
    what: "Your shop",
    detail: "Shop details, stock, prices, bills and khata.",
    who: "only you",
  },
  {
    what: "Your voice",
    detail:
      "Audio goes to Deepgram to become text. The text goes to an AI model on Groq to pick the items. We don’t keep the recording.",
    who: "those two, for a few seconds",
  },
  {
    what: "Cookies",
    detail: "Login cookies, so you stay logged in. That’s all.",
    who: "your browser",
  },
]

export function PrivacyPage() {
  const root = React.useRef<HTMLDivElement>(null)

  // a red pen underlines "your data", then the ledger rows are written in one by one
  useGSAP(
    () => {
      if (reduceMotion()) return
      const q = gsap.utils.selector(root.current)
      const pen = q("[data-pen]")
      const rows = q("[data-row]")
      gsap.set(pen, { strokeDasharray: 1, strokeDashoffset: 1 })
      gsap.set(rows, { x: -20, autoAlpha: 0 })
      gsap.to(pen, {
        strokeDashoffset: 0,
        duration: 0.8,
        ease: "power2.inOut",
        delay: 1.3,
      })
      const list = root.current?.querySelector("[data-ledger]")
      if (!list) return
      const io = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return
          io.disconnect()
          gsap.to(rows, {
            x: 0,
            autoAlpha: 1,
            duration: 0.6,
            stagger: 0.12,
            ease: "power3.out",
          })
        },
        { threshold: 0.1 }
      )
      io.observe(list)
      const failsafe = window.setTimeout(
        () => gsap.to(rows, { x: 0, autoAlpha: 1 }),
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
            <p className="font-hand text-2xl text-signal sm:text-4xl">
              Privacy
            </p>
            <h1 className="text-[clamp(2rem,8.5vw,4.4rem)] leading-[1] font-extrabold">
              Privacy is only for{" "}
              <span className="relative inline-block whitespace-nowrap">
                your data.
                <svg
                  aria-hidden="true"
                  viewBox="0 0 300 16"
                  preserveAspectRatio="none"
                  className="absolute inset-x-0 -bottom-2 h-3 w-full overflow-visible text-signal"
                >
                  <path
                    data-pen
                    pathLength={1}
                    d="M3 9C60 2 110 14 160 8s90 5 137-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </span>
            </h1>
            <p className="mt-4 max-w-[44ch] text-[15px] leading-relaxed text-foreground/80 sm:text-lg">
              Ours? None, our code is a mess anyway. Yours is safe though.
            </p>
          </div>
        </Wrap>

        <Wrap className="mt-8 sm:mt-12">
          <div
            data-ledger
            className="relative overflow-hidden rounded-[1.25rem] bg-[#fbf8ee] text-[#1d2a22] shadow-[0_24px_50px_-28px_rgb(0_0_0/0.6)]"
          >
            {/* the red margin line of a khata book */}
            <div
              aria-hidden="true"
              className="absolute inset-y-0 left-3 w-px bg-[#d8431f]/50 sm:left-5"
            />
            <ul className="divide-y divide-[#1d2a22]/12 pl-6 sm:pl-10">
              {ROWS.map((r) => (
                <li
                  key={r.what}
                  data-row
                  className="grid gap-0.5 py-3.5 pr-4 sm:grid-cols-[10rem_1fr] sm:gap-6 sm:py-5 sm:pr-7"
                >
                  <p className="font-hand text-[1.6rem] leading-none text-[#10301f]">
                    {r.what}
                  </p>
                  <div>
                    <p className="text-[15px] leading-snug text-[#1d2a22]/85">
                      {r.detail}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-[#d8431f]">
                      seen by: {r.who}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Wrap>

        <Wrap className="mt-6 mb-14 sm:mt-10 sm:mb-24">
          <div
            data-rise
            className="grid gap-4 text-[15px] text-foreground/80 sm:grid-cols-2 sm:gap-8"
          >
            <p>
              <b className="text-foreground">We don’t</b> sell your data (nobody
              asked lol), show ads, or read your bills for fun.
            </p>
            <p>
              <b className="text-foreground">Want it gone?</b> Delete a shop and
              its data goes too. For the whole account,{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-semibold underline underline-offset-4"
              >
                email us
              </a>
              .
            </p>
          </div>
        </Wrap>
      </div>
    </CompanyShell>
  )
}
