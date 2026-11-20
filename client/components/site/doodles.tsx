import * as React from "react"

import { BRAND } from "@/lib/lang"

type P = React.SVGProps<SVGSVGElement>

export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <path
          d="M4 14C4 7.4 9.4 3 16 3s12 4.4 12 11-5.4 11-12 11c-1.3 0-2.5-.2-3.7-.5L6 29l1.4-6.3C5.4 20.8 4 17.6 4 14Z"
          fill="var(--hl)"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M10.5 12v4M14 9.5v9M17.5 11v6M21 13v2"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-display text-[1.1rem] leading-none font-extrabold tracking-tight sm:text-[1.35rem]">
        {BRAND}
      </span>
    </span>
  )
}

/** Hand-drawn curly arrow */
export function CurlyArrow(props: P) {
  return (
    <svg viewBox="0 0 120 90" fill="none" aria-hidden="true" {...props}>
      <path
        d="M6 8C40 2 74 14 70 38c-3 22-34 18-30-2 3-14 30-12 46 6 10 11 14 24 14 34"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="m92 66 8 18 14-14"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Marker scribble underline */
export function Scribble(props: P) {
  return (
    <svg viewBox="0 0 220 18" fill="none" preserveAspectRatio="none" aria-hidden="true" {...props}>
      <path
        d="M3 11C40 4 70 15 110 8s70 4 107-3"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Sparkle(props: P) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" {...props}>
      <path
        d="M20 2c1 10 8 17 18 18-10 1-17 8-18 18-1-10-8-17-18-18 10-1 17-8 18-18Z"
        fill="currentColor"
      />
    </svg>
  )
}

/** Round hand-drawn loop used around a mic */
export function Squiggle(props: P) {
  return (
    <svg viewBox="0 0 160 40" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 24c14-18 24 12 38-4s22 12 36-4 24 10 38-2 24 6 40-4"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}
