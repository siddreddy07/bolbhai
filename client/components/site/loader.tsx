"use client"

import * as React from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

import { Wordmark } from "@/components/site/wordmark"
import { TAGLINE } from "@/lib/lang"

/**
 * Loading screen, driven by real readiness. If the page is already ready
 * (loaded + fonts) it just fades away. Otherwise the name draws itself, the
 * tagline is scribbled in and underlined, and the screen holds until the page
 * is ready, then lifts. It exists in the server HTML (CSS shows it only while
 * <html class="loading">), so nothing flashes before it. Skipped with reduced motion.
 */
export function Loader() {
  const root = React.useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const html = document.documentElement
      if (!html.classList.contains("loading")) return
      const q = gsap.utils.selector(root.current)
      // sticky signal: listeners that mount later still see it
      const lift = () => {
        html.dataset.lifted = "1"
        window.dispatchEvent(new Event("loader:lift"))
      }
      const finish = () => {
        html.classList.remove("loading")
        gsap.set(root.current, { display: "none" })
      }
      // "ready" = every resource loaded and the web fonts settled
      const isReady = () =>
        document.readyState === "complete" &&
        (!document.fonts || document.fonts.status !== "loading")

      // Already ready (cached / fast): no animation, just show the page.
      if (isReady()) {
        lift()
        gsap.to(root.current, {
          autoAlpha: 0,
          duration: 0.35,
          ease: "power1.out",
          onComplete: finish,
        })
        return
      }

      // Not ready yet: play the scribble, hold until the page is ready, then lift.
      let ready = false
      let waiting = false
      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        onComplete: finish,
      })
      tl.set(q("[data-wm-letter]"), { yPercent: 105 })
        .set(q("[data-wm-mascot]"), {
          autoAlpha: 0,
          scale: 0.4,
          y: 30,
          transformOrigin: "50% 100%",
        })
        .set(q("[data-ld-line]"), { clipPath: "inset(0 100% 0 0)" })
        .set(q("[data-ld-under]"), { strokeDasharray: 1, strokeDashoffset: 1 })
        .set(q("[data-ld-pop]"), { scale: 0, transformOrigin: "50% 50%" })
        // 1. the letters rise one by one, and BolBhai steps into the "a"
        .to(q("[data-wm-letter]"), {
          yPercent: 0,
          duration: 0.8,
          stagger: 0.08,
          ease: "power4.out",
        })
        .to(
          q("[data-wm-mascot]"),
          {
            autoAlpha: 1,
            scale: 1,
            y: 0,
            duration: 0.7,
            ease: "back.out(2)",
          },
          "-=0.55"
        )
        // 2. a marker scribble under it
        .to(
          q("[data-ld-under]"),
          { strokeDashoffset: 0, duration: 0.55, ease: "power2.inOut" },
          "-=0.2"
        )
        // 3. the tagline is written left to right
        .to(
          q("[data-ld-line]"),
          { clipPath: "inset(0 0% 0 0)", duration: 0.95, ease: "power1.inOut" },
          "-=0.15"
        )
        .to(
          q("[data-ld-pop]"),
          { scale: 1, duration: 0.4, stagger: 0.1, ease: "back.out(3)" },
          "-=0.3"
        )
        // 4. hold here until the page is truly ready
        .call(() => {
          if (!ready) {
            waiting = true
            tl.pause()
          }
        })
        .to({}, { duration: 0.3 })
        // 5. lift: the hero starts entering as the screen rises
        .call(() => void lift())
        .to(
          q("[data-ld-body]"),
          { y: -24, autoAlpha: 0, duration: 0.5, ease: "power2.in" },
          "<"
        )
        .to(
          root.current,
          { yPercent: -100, duration: 0.85, ease: "power4.inOut" },
          "<0.1"
        )

      const onReady = () => {
        if (ready || !isReady()) return
        ready = true
        window.clearInterval(poll)
        tl.timeScale(2.2) // page is ready: don't make anyone wait for the flourish
        if (waiting) {
          waiting = false
          tl.play()
        }
      }
      const poll = window.setInterval(onReady, 150)
      window.addEventListener("load", onReady)
      document.fonts?.ready.then(onReady)

      // never trap a visitor behind the loader
      const failsafe = window.setTimeout(() => {
        ready = true
        tl.timeScale(4).play()
      }, 6000)
      return () => {
        window.clearTimeout(failsafe)
        window.clearInterval(poll)
        window.removeEventListener("load", onReady)
        tl.kill()
      }
    },
    { scope: root }
  )

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="loader fixed inset-0 z-[100] items-center justify-center bg-[#10301f] text-[#f2f2e8]"
    >
      <div
        data-ld-body
        className="flex w-full max-w-[560px] flex-col items-center px-6"
      >
        {/* the name, with BolBhai himself as the "a" */}
        <div className="relative">
          <Wordmark className="text-[clamp(3.5rem,18vw,7rem)]" mascot={0.95} />
          {/* marker scribble underline */}
          <svg
            viewBox="0 0 520 20"
            preserveAspectRatio="none"
            className="mt-1 h-3 w-full overflow-visible sm:h-4"
          >
            <path
              data-ld-under
              pathLength={1}
              d="M8 12C110 4 170 17 260 10s170 8 252-4"
              fill="none"
              stroke="var(--hl)"
              strokeWidth="6"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* the tagline, handwritten */}
        <div className="relative mt-4 sm:mt-6">
          <p
            data-ld-line
            className="font-hand text-[1.9rem] leading-none whitespace-nowrap sm:text-5xl"
            style={{ color: "var(--hl)" }}
          >
            {TAGLINE.en.join(" ")}
          </p>
          <svg
            data-ld-pop
            viewBox="0 0 40 40"
            className="absolute -top-4 -right-6 size-6 text-[#f25c2a] sm:-right-9 sm:size-8"
            aria-hidden="true"
          >
            <path
              d="M20 2c1 10 8 17 18 18-10 1-17 8-18 18-1-10-8-17-18-18 10-1 17-8 18-18Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}
