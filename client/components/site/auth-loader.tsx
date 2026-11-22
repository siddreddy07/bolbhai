"use client"

import * as React from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

import { Wordmark } from "@/components/site/wordmark"

const BARS = 7

/**
 * Shown while we ask the server who is logged in. BolBhai himself waits in the middle (his own loop, the picture
 * shows first while the video loads), a soft shadow breathes under his feet, and a row of voice bars rolls a wave
 * from the middle outwards: BolBhai listens before it answers.
 */
export function AuthLoader({ label = "Checking you in" }: { label?: string }) {
  const root = React.useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      const q = gsap.utils.selector(root.current)
      // the letters rise, then he steps into the "a"
      gsap.from(q("[data-wm-letter]"), {
        yPercent: 105,
        duration: 0.7,
        stagger: 0.07,
        ease: "power4.out",
      })
      gsap.from(q("[data-wm-mascot]"), {
        autoAlpha: 0,
        scale: 0.4,
        y: 30,
        duration: 0.7,
        delay: 0.35,
        ease: "back.out(2)",
        transformOrigin: "50% 100%",
      })
      gsap.from(q("[data-label]"), {
        autoAlpha: 0,
        y: 8,
        duration: 0.5,
        delay: 0.6,
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
      <div className="flex flex-col items-center">
        <div data-hero>
          <Wordmark className="text-[clamp(3.5rem,18vw,6.5rem)]" mascot={0.95} />
        </div>

        <div aria-hidden="true" className="mt-4 flex h-7 items-center gap-1.5">
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
        <p data-label className="mt-3 font-hand text-2xl text-muted-foreground">
          {label}…
        </p>
      </div>
    </div>
  )
}
