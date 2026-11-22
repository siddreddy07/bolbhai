import * as React from "react"

import { BRAND } from "@/lib/lang"

type P = React.SVGProps<SVGSVGElement>

export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      {/* the whole mascot is the logo everywhere (navbar, footer, loader, dashboard) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mascot/bolbhai-logo.png"
        alt=""
        width={120}
        height={152}
        aria-hidden="true"
        className="h-10 w-auto shrink-0 sm:h-11"
      />
      <span className="font-display pt-[3px] text-[1.1rem] leading-none font-extrabold tracking-tight sm:text-[1.35rem]">
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
    <svg
      viewBox="0 0 220 18"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
      {...props}
    >
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
