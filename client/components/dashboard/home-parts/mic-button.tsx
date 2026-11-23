"use client"

import * as React from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { Mic } from "lucide-react"

import { MicBars } from "@/components/dashboard/mic-bars"
import { useHomeStore } from "@/store/home-store"

/** The mic lives where the thumb already is. */
export function MicButton() {
  const phase = useHomeStore((s) => s.phase)
  const micError = useHomeStore((s) => s.micError)
  const tapMic = useHomeStore((s) => s.tapMic)
  const root = React.useRef<HTMLDivElement>(null)

  // the mic changes shape: a circle while idle, a rounded square (the stop shape) while it records
  useGSAP(
    () => {
      const q = gsap.utils.selector(root.current)
      const radius = phase === "listening" ? "26%" : "50%"
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        gsap.set(q("[data-mic]"), { borderRadius: radius })
      else
        gsap.to(q("[data-mic]"), {
          borderRadius: radius,
          duration: 0.5,
          ease: "back.out(1.7)",
        })
    },
    { dependencies: [phase], scope: root }
  )

  return (
    <div
      ref={root}
      data-micwrap
      className="relative flex shrink-0 flex-col items-center [--u:1rem] [@media(max-height:760px)]:[--u:0.78rem] md:[@media(min-height:1000px)]:[--u:1.3rem] sm:[@media(min-height:900px)]:[--u:1.1rem]"
    >
      <div className="relative grid size-[calc(var(--u)*9.5)] place-items-center">
        <button
          data-mic
          type="button"
          onClick={() => tapMic()}
          disabled={phase === "thinking" || phase === "confirm"}
          aria-label={phase === "listening" ? "Stop" : "Start talking"}
          className="relative grid size-[calc(var(--u)*6.5)] place-items-center rounded-[50%] bg-signal text-white shadow-[0_18px_40px_-10px_rgb(242_92_42/0.7)] transition-transform active:scale-90 disabled:opacity-40"
        >
          {phase === "listening" ? (
            <MicBars />
          ) : (
            <Mic className="size-[calc(var(--u)*2.5)]" />
          )}
        </button>
      </div>
      <p className="-mt-1 text-sm font-semibold text-muted-foreground">
        {micError ?? (phase === "listening" ? "Tap to stop" : "Tap and say it")}
      </p>
    </div>
  )
}
