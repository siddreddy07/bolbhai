"use client"

import * as React from "react"
import Link from "next/link"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

import { Logo } from "@/components/site/doodles"
import { Mascot } from "@/components/site/mascot"
import { BRAND } from "@/lib/lang"

// Only pages that exist. English is the only language for now, so there is no Languages column.
const COLS: [string, [string, string][]][] = [
  [
    "Product",
    [
      ["Assistant", "/dashboard"],
      ["Stock", "/dashboard/stock"],
      ["Bills", "/dashboard/bills"],
      ["Khata", "/dashboard/khata"],
    ],
  ],
  [
    "Company",
    [
      ["About", "/about"],
      ["Contact", "/contact"],
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
    ],
  ],
]

export function Footer() {
  const root = React.useRef<HTMLElement>(null)
  const mark = React.useRef<HTMLDivElement>(null)

  // The wordmark rises letter by letter when it scrolls into view. GSAP alone
  // owns the hidden state (set below, far off screen), so there is no CSS
  // transform for it to misread. A native IntersectionObserver fires the tween.
  useGSAP(
    () => {
      const letters = gsap.utils.toArray<HTMLElement>(
        "[data-letter]",
        root.current
      )
      const el = mark.current
      if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        return
      gsap.set(letters, { yPercent: 105 })
      const io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return
          io.disconnect()
          gsap.to(letters, {
            yPercent: 0,
            duration: 1.1,
            ease: "power4.out",
            stagger: 0.06,
            overwrite: true,
          })
        },
        { threshold: 0.15 }
      )
      io.observe(el)
      // if observing somehow never fires, never leave the name hidden
      const failsafe = window.setTimeout(() => {
        io.disconnect()
        gsap.to(letters, { yPercent: 0, duration: 0.6 })
      }, 12000)
      return () => {
        window.clearTimeout(failsafe)
        io.disconnect()
      }
    },
    { scope: root }
  )

  return (
    <footer
      ref={root}
      className="mx-2 mt-2 mb-2 overflow-hidden rounded-[1.5rem] bg-[#0d1812] px-5 pt-7 text-[#f2f2e8] sm:mx-3 sm:mt-3 sm:mb-3 sm:rounded-[2rem] sm:px-10 sm:pt-14 dark:bg-[#131715]"
    >
      <div className="mx-auto grid max-w-[1120px] gap-5 md:grid-cols-[1.2fr_2fr] md:gap-10">
        <div data-reveal>
          <Logo />
          <p className="mt-2 max-w-[30ch] text-sm leading-relaxed opacity-70 sm:mt-4 sm:text-base">
            The voice assistant for shopkeepers and wholesalers.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm sm:gap-8 sm:text-base">
          {COLS.map(([h, items]) => (
            <div key={h} data-reveal>
              <p className="font-semibold">{h}</p>
              <ul className="mt-2 space-y-1.5 opacity-70 sm:mt-3 sm:space-y-2">
                {items.map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="underline-offset-4 hover:underline hover:opacity-100"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div
        ref={mark}
        aria-hidden="true"
        className="font-display mx-auto mt-5 flex max-w-[1400px] justify-center overflow-hidden pb-2 text-[clamp(4rem,19vw,17rem)] leading-[0.85] font-extrabold tracking-tighter select-none sm:mt-14"
        style={{ fontVariationSettings: '"wdth" 90' }}
      >
        {BRAND.split("").map((c, i) => (
          <span key={i} className="inline-block overflow-hidden pb-[0.08em]">
            <span data-letter className="inline-block will-change-transform">
              {i === BRAND.lastIndexOf("a") ? (
                // the "a" of Bhai is the mascot, as tall as the capitals; the letter shows if the mascot files are missing
                <Mascot
                  className="h-[0.8em] w-auto align-baseline sm:w-auto"
                  fallback={c}
                />
              ) : (
                c
              )}
            </span>
          </span>
        ))}
      </div>
      <p className="mx-auto max-w-[1120px] pb-4 text-xs opacity-50 sm:pb-6 sm:text-sm">
        © 2026 {BRAND}
      </p>
    </footer>
  )
}
