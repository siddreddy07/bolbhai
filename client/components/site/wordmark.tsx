"use client"

import * as React from "react"

import { Mascot } from "@/components/site/mascot"
import { BRAND } from "@/lib/lang"
import { cn } from "@/lib/utils"

/**
 * The name set large, with the animated mascot standing beside it (left), like the logo in the navbar.
 * Size it with a font size on `className` (the mascot follows it); `mascot` is his height in em.
 * Each letter carries `data-wm-letter` and the mascot's slot `data-wm-mascot`, so a screen can animate them.
 * If the mascot files are missing only the name shows.
 */
export function Wordmark({
  className,
  mascot = 1,
}: {
  className?: string
  mascot?: number
}) {
  return (
    <span
      className={cn(
        "font-display inline-flex items-end gap-[0.08em] leading-[0.85] font-extrabold tracking-tighter",
        className
      )}
      style={{ fontVariationSettings: '"wdth" 90' }}
    >
      <span
        data-wm-mascot
        className="inline-block pb-[0.08em] will-change-transform"
      >
        <Mascot
          className="inline-block w-auto align-baseline sm:w-auto"
          style={{ height: `${mascot}em` }}
        />
      </span>
      <span className="inline-flex">
        {BRAND.split("").map((c, i) => (
          <span key={i} className="inline-block overflow-hidden pb-[0.08em]">
            <span data-wm-letter className="inline-block will-change-transform">
              {c}
            </span>
          </span>
        ))}
      </span>
    </span>
  )
}
