"use client"

import * as React from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

import { getMicLevel } from "@/lib/stt"

// the middle bar moves the most, the outer ones the least
const WEIGHTS = [0.4, 0.7, 0.9, 1, 0.9, 0.7, 0.4]

/** Lives inside the mic button while it records: the bars dance to your voice. */
export function MicBars() {
  const root = React.useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      const bars = gsap.utils.toArray<HTMLElement>("[data-bar]", root.current)
      const set = bars.map((bar) => gsap.quickSetter(bar, "scaleY"))

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        set.forEach((setBar, i) => setBar(0.3 + 0.6 * WEIGHTS[i]))
        return
      }

      const level = bars.map(() => 0.15)
      const tick = () => {
        const voice = getMicLevel()
        const t = gsap.ticker.time
        bars.forEach((_, i) => {
          // a small wobble keeps it alive in silence, your voice pushes it up
          const idle = 0.16 + 0.06 * Math.sin(t * 6 + i * 1.3)
          const target = Math.min(1, idle + voice * WEIGHTS[i] * 1.2)
          level[i] += (target - level[i]) * (target > level[i] ? 0.55 : 0.16) // quick up, slow down
          set[i](level[i])
        })
      }
      gsap.ticker.add(tick)
      return () => gsap.ticker.remove(tick)
    },
    { scope: root }
  )

  return (
    <span ref={root} aria-hidden="true" className="flex h-[calc(var(--u)*2.8)] items-center gap-[calc(var(--u)*0.32)]">
      {WEIGHTS.map((_, i) => (
        <i key={i} data-bar className="h-full w-[calc(var(--u)*0.4)] origin-center scale-y-[0.15] rounded-full bg-white" />
      ))}
    </span>
  )
}
