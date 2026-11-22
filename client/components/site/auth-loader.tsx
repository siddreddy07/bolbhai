"use client"

import * as React from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

import { Logo } from "@/components/site/doodles"

const BARS = 7

/**
 * Shown while we ask the server who is logged in. The logo drops in, and a row of voice bars
 * rolls a wave from the middle outwards (BolBhai listens before it answers).
 */
export function AuthLoader({ label = "Checking you in" }: { label?: string }) {
  const root = React.useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      const q = gsap.utils.selector(root.current)
      gsap.from(q("[data-logo]"), {
        y: -18,
        autoAlpha: 0,
        scale: 0.8,
        duration: 0.6,
        ease: "back.out(2.2)",
      })
      gsap.from(q("[data-label]"), {
        autoAlpha: 0,
        y: 6,
        duration: 0.5,
        delay: 0.25,
        ease: "power2.out",
      })
      // the wave: every bar grows and shrinks, the middle one first
      gsap.fromTo(
        q("[data-bar]"),
        { scaleY: 0.25 },
        {
          scaleY: 1,
          duration: 0.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          stagger: { each: 0.09, from: "center", repeat: -1, yoyo: true },
        }
      )
    },
    { scope: root }
  )

  return (
    <div
      ref={root}
      role="status"
      aria-live="polite"
      className="grid min-h-dvh place-items-center bg-background px-6"
    >
      <div className="flex flex-col items-center gap-7">
        <span data-logo>
          <Logo className="text-xl font-extrabold" />
        </span>
        <div aria-hidden="true" className="flex h-10 items-center gap-1.5">
          {Array.from({ length: BARS }, (_, i) => (
            <i
              key={i}
              data-bar
              className="h-full w-1.5 origin-center scale-y-[0.25] rounded-full"
              style={{
                background:
                  i === Math.floor(BARS / 2) ? "var(--signal)" : "var(--ink)",
              }}
            />
          ))}
        </div>
        <p data-label className="font-hand text-2xl text-muted-foreground">
          {label}…
        </p>
      </div>
    </div>
  )
}
