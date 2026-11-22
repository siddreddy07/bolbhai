"use client"

import * as React from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { Mic, Package, Receipt, Users } from "lucide-react"

import {
  DashboardMock,
  KhataMock,
  ReceiptMock,
  StockMock,
} from "@/components/site/app-mock"
import { HeroBackdrop } from "@/components/site/backdrop"
import {
  LISTENING,
  SPOKEN,
  TAGLINE,
  langClass,
  useLang,
  type Lang,
} from "@/lib/lang"
import { cn } from "@/lib/utils"

const BARS = 40
const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN")

type Phase = "idle" | "listening" | "thinking" | "done"

export function Hero() {
  const root = React.useRef<HTMLElement>(null)
  const { lang } = useLang()
  const [phase, setPhase] = React.useState<Phase>("idle")
  const phaseRef = React.useRef<Phase>("idle")
  const amp = React.useRef(0)
  const tl = React.useRef<gsap.core.Timeline | null>(null)
  const entered = React.useRef(false)
  const langRef = React.useRef(lang)
  const runRef = React.useRef<((l: Lang, d?: number) => void) | null>(null)
  React.useEffect(() => {
    langRef.current = lang
  }, [lang])

  const setP = React.useCallback((p: Phase) => {
    phaseRef.current = p
    setPhase(p)
  }, [])

  /** Put every animated value back to the "before" state. */
  const reset = React.useCallback(() => {
    const q = gsap.utils.selector(root.current)
    gsap.set(q("[data-chip]"), { autoAlpha: 0, scale: 0.8 })
    gsap.set(q("[data-slip]"), { yPercent: 115, autoAlpha: 1 })
    gsap.set(q("[data-inv-row]"), { autoAlpha: 0, y: 8 })
    gsap.set(q("[data-stamp]"), { autoAlpha: 0, scale: 2.2, rotate: -14 })
    gsap.set(q("[data-khata-row]"), { backgroundColor: "transparent" })
    const set = (sel: string, t: string) =>
      q(sel).forEach((el) => ((el as HTMLElement).textContent = t))
    set("[data-stock]", "40")
    set("[data-sales]", inr(18450))
    set("[data-bills]", "23")
    set("[data-due]", inr(0))
    set("[data-inv-total]", inr(0))
  }, [])

  const run = React.useCallback(
    (l: Lang, delay = 0) => {
      const el = root.current
      if (!el) return
      tl.current?.kill()
      reset()
      const q = gsap.utils.selector(el)
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
      const typed = q("[data-transcript]")[0] as HTMLElement
      const num = { stock: 40, sales: 18450, bills: 23, due: 0, total: 0 }
      const paint = () => {
        const w = (sel: string, t: string) =>
          q(sel).forEach((e) => ((e as HTMLElement).textContent = t))
        w("[data-stock]", String(Math.round(num.stock)))
        w("[data-sales]", inr(num.sales))
        w("[data-bills]", String(Math.round(num.bills)))
        w("[data-due]", inr(num.due))
        w("[data-inv-total]", inr(num.total))
      }
      const say = (text: string) => {
        typed.textContent = text
      }

      const t = gsap.timeline({
        delay,
        defaults: { ease: "power3.out" },
        onComplete: () => {
          if (reduce) return
          // loop in the chosen language only
          runRef.current?.(langRef.current, 0.4)
        },
      })
      t.call(() => {
        setP("listening")
        say(LISTENING[l])
        gsap.set(typed, { autoAlpha: 1 })
      })
        .to(amp, { current: 1, duration: 0.4 }, "<")
        // the line appears whole, no typing
        .to(typed, { autoAlpha: 0, duration: 0.15 }, 1)
        .call(() => say(SPOKEN[l]))
        .to(typed, { autoAlpha: 1, duration: 0.35 })
        .to({}, { duration: 1.5 })
        .call(() => setP("thinking"))
        .to(amp, { current: 0.3, duration: 0.3 }, "<")
        .to(q("[data-chip]"), {
          autoAlpha: 1,
          scale: 1,
          stagger: 0.12,
          duration: 0.45,
          ease: "back.out(2)",
        })
        .call(() => setP("done"), undefined, "+=0.2")
        .to(amp, { current: 0, duration: 0.5 }, "<")
        // the app updates
        .to(num, { stock: 35, duration: 0.8, onUpdate: paint }, "<0.1")
        .to(
          q("[data-khata-row]"),
          { backgroundColor: "rgba(247,227,59,.55)", duration: 0.3 },
          "<"
        )
        .to(num, { due: 4200, duration: 1, onUpdate: paint }, "<")
        .to(num, { sales: 24650, bills: 24, duration: 1, onUpdate: paint }, "<")
        // the invoice prints
        .to(
          q("[data-slip]"),
          { yPercent: 0, duration: 0.9, ease: "power4.out" },
          "<0.2"
        )
        .to(
          q("[data-inv-row]"),
          { autoAlpha: 1, y: 0, stagger: 0.14, duration: 0.4 },
          "<0.45"
        )
        .to(num, { total: 6200, duration: 0.8, onUpdate: paint }, "<0.2")
        .to(q("[data-stamp]"), {
          autoAlpha: 1,
          scale: 1,
          rotate: -8,
          duration: 0.35,
          ease: "back.out(3)",
        })
        .to(
          q("[data-khata-row]"),
          { backgroundColor: "rgba(247,227,59,0)", duration: 1 },
          "+=0.2"
        )
        // hold, then clear the desk for the next language
        .to({}, { duration: 1.6 })
        .call(() => setP("idle"))
        .to(q("[data-slip]"), {
          yPercent: 115,
          duration: 0.6,
          ease: "power3.in",
        })
        .to(q("[data-chip]"), { autoAlpha: 0, scale: 0.9, duration: 0.3 }, "<")

      if (reduce) t.progress(1)
      tl.current = t
    },
    [reset, setP]
  )

  React.useEffect(() => {
    runRef.current = run
  }, [run])

  // One entrance on load, then the demo plays itself once
  useGSAP(
    () => {
      const q = gsap.utils.selector(root.current)
      const header = document.querySelector("header[data-enter]")
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
      reset()
      if (reduce) {
        gsap.set([header, ...q("[data-enter]")], { autoAlpha: 1 })
        run(langRef.current)
        entered.current = true
        return
      }
      gsap.set(q("[data-w]"), { yPercent: 115 })
      gsap.set(q("[data-enter]"), { autoAlpha: 1 })
      gsap.set(header, { autoAlpha: 1 })
      // wait for the loading screen to lift, then play the entrance once
      const e = gsap.timeline({
        paused: true,
        defaults: { ease: "power4.out" },
      })
      e.from(header, { y: -40, autoAlpha: 0, duration: 0.8 })
        .to(q("[data-w]"), { yPercent: 0, duration: 1, stagger: 0.06 }, 0.1)
        .from(q("[data-sub]"), { y: 20, autoAlpha: 0, duration: 0.8 }, 0.6)
        .from(
          q("[data-pill]"),
          { y: 28, autoAlpha: 0, scale: 0.96, duration: 0.9 },
          0.75
        )
        .from(q("[data-stage]"), { y: 90, autoAlpha: 0, duration: 1.1 }, 0.9)
        .call(() => {
          entered.current = true
          run(langRef.current, 0.3)
        })
      const start = () => void e.play()
      if (
        document.documentElement.classList.contains("loading") &&
        !document.documentElement.dataset.lifted
      ) {
        window.addEventListener("loader:lift", start, { once: true })
        const failsafe = window.setTimeout(start, 7000)
        return () => {
          window.removeEventListener("loader:lift", start)
          window.clearTimeout(failsafe)
        }
      }
      start()
    },
    { scope: root }
  )

  // Replay in the chosen language when it changes (after the first run)
  React.useEffect(() => {
    if (entered.current) run(lang, 0.15)
  }, [lang, run])

  // Pause the loop while the hero is off screen or the tab is hidden
  React.useEffect(() => {
    const el = root.current
    if (!el) return
    let visible = true
    const apply = () => tl.current?.paused(!visible || document.hidden)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      apply()
    })
    io.observe(el)
    document.addEventListener("visibilitychange", apply)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", apply)
    }
  }, [])

  React.useEffect(() => () => void tl.current?.kill(), [])

  // Waveform: one ticker callback, attached only while the mic is active
  const bars = React.useRef<(HTMLSpanElement | null)[]>([])
  React.useEffect(() => {
    if (phase === "idle") {
      bars.current.forEach((b) => b && (b.style.transform = ""))
      return
    }
    const tick = (time: number) => {
      if (tl.current?.paused()) return
      const a = amp.current
      bars.current.forEach((b, i) => {
        if (!b) return
        const env = Math.sin((i / (BARS - 1)) * Math.PI) * 0.6 + 0.4
        const v =
          0.5 +
          0.5 * Math.sin(time * 7.3 + i * 0.9) * Math.sin(time * 3.1 + i * 0.37)
        b.style.transform = `scaleY(${Math.max(0.14, v * env * a + 0.14)})`
      })
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [phase])

  const listening = phase === "listening"
  const status =
    phase === "listening"
      ? LISTENING[lang]
      : phase === "thinking"
        ? "Understanding…"
        : phase === "done"
          ? "Done. Invoice ready."
          : "Demo running."

  return (
    <section
      id="try"
      ref={root}
      className="relative mx-2 mt-2 flex flex-col overflow-hidden rounded-[1.5rem] bg-[var(--stage)] pt-[5.25rem] text-foreground sm:mx-3 sm:mt-3 sm:rounded-[2rem] sm:pt-28 lg:min-h-[calc(100svh-1.5rem)] lg:pt-32"
    >
      <HeroBackdrop />

      <div className="relative mx-auto flex w-full max-w-[1100px] flex-col items-center px-5 text-center">
        <h1
          data-enter
          aria-label={TAGLINE[lang].join(" ")}
          className={cn(
            "max-w-[18ch] text-[clamp(1.85rem,6.4vw,3rem)] leading-[1.05] font-extrabold lg:text-[clamp(3.5rem,6.2vw,5.6rem)] lg:leading-[1]",
            langClass(lang)
          )}
          style={{ fontVariationSettings: '"wdth" 92' }}
        >
          {TAGLINE[lang].map((line, li) => (
            <span key={`${lang}-${li}`} className="block" aria-hidden="true">
              {line.split(" ").map((w, i) => (
                <span key={i}>
                  <span className="inline-block overflow-hidden pb-[0.1em] align-bottom">
                    <span data-w className="inline-block">
                      {w}
                    </span>
                  </span>{" "}
                </span>
              ))}
            </span>
          ))}
        </h1>
        <p
          data-enter
          data-sub
          className="mt-3 max-w-[46ch] text-sm leading-snug text-foreground/75 sm:mt-5 sm:text-base sm:leading-relaxed lg:text-lg"
        >
          Say the order out loud, in English. Stock, bills and your khata update
          themselves.
        </p>

        {/* The try-out: voice pill */}
        <div
          data-enter
          data-pill
          className="relative mt-4 w-full max-w-[680px] sm:mt-7"
        >
          <div className="flex items-center gap-2.5 rounded-full border border-foreground/15 bg-card p-1.5 pr-4 shadow-[0_14px_40px_-16px_rgb(16_48_31/0.45)] sm:gap-3 sm:p-2 sm:pr-5">
            <div
              aria-hidden="true"
              className="relative grid size-11 shrink-0 place-items-center rounded-full bg-signal text-white sm:size-14"
            >
              {(listening || phase === "thinking") && (
                <span className="absolute inset-0 [animation:pulse-ring_1.4s_ease-out_infinite] rounded-full bg-signal" />
              )}
              <Mic className="relative size-5 sm:size-6" />
            </div>
            <p
              data-transcript
              className={cn(
                "line-clamp-2 min-w-0 flex-1 text-left text-sm leading-snug font-medium sm:text-base",
                langClass(lang),
                phase === "listening" || phase === "thinking"
                  ? "text-foreground"
                  : "text-foreground/60"
              )}
            >
              {SPOKEN[lang]}
            </p>
            <div
              aria-hidden="true"
              className="flex h-9 w-[84px] shrink-0 items-center gap-[2px] sm:w-[132px]"
            >
              {Array.from({ length: BARS }).map((_, i) => (
                <span
                  key={i}
                  ref={(el) => {
                    bars.current[i] = el
                  }}
                  className={cn(
                    "h-full flex-1 origin-center scale-y-[.2] rounded-full bg-foreground/80",
                    phase === "idle" &&
                      "[animation:breathe_2.6s_ease-in-out_infinite]",
                    i % 2 && "max-sm:hidden"
                  )}
                  style={{ animationDelay: `${(i % 9) * 0.18}s` }}
                />
              ))}
            </div>
          </div>
          <p className="sr-only" role="status" aria-live="polite">
            {status}
          </p>
          {/* what the AI understood: space is reserved so nothing jumps */}
          <div className="mt-2 flex h-8 flex-wrap items-center justify-center gap-1.5 text-xs font-semibold sm:mt-3 sm:h-9 sm:gap-2 sm:text-sm">
            {[
              [Receipt, "Create invoice"],
              [Users, "Ramesh"],
              [Package, "Rice 25 kg × 5"],
            ].map(([Icon, label], i) => {
              const I = Icon as typeof Receipt
              return (
                <span
                  key={i}
                  data-chip
                  className="inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 shadow-sm max-sm:last:hidden sm:px-3 sm:py-1.5"
                >
                  <I className="size-4 text-signal" />
                  {label as string}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* The SaaS, in the middle of it all */}
      <div
        data-enter
        data-stage
        className="relative mx-auto mt-2 flex w-full max-w-[1000px] flex-1 flex-col px-3 sm:mt-4 sm:px-6"
      >
        <AppFrame />
      </div>
    </section>
  )
}

/** The app, drawn in code: Khata, the dashboard and Stock side by side, the bill printing over the dashboard when the demo finishes. */
function AppFrame() {
  return (
    <div className="relative mx-auto h-[310px] w-full max-w-[1000px] overflow-hidden sm:h-[400px] lg:h-[450px]">
      <div className="mx-auto flex h-full items-start justify-center gap-4">
        <div className="mt-10 hidden shrink-0 opacity-90 sm:block">
          <KhataMock className="h-[460px] w-[24em] text-[10px] lg:text-[11.5px]" />
        </div>
        <DashboardMock className="h-[560px] w-[26em] shrink-0 text-[11.5px] sm:text-[12px] lg:text-[13px]" />
        <div className="mt-10 hidden shrink-0 opacity-90 sm:block">
          <StockMock className="h-[460px] w-[24em] text-[10px] lg:text-[11.5px]" />
        </div>
      </div>

      {/* the bill, printed from the voice command */}
      <div className="pointer-events-none absolute right-[6%] bottom-0 w-[16.5em] overflow-hidden text-[12px] sm:right-[20%] sm:w-[19em] sm:text-[13px]">
        <div data-slip>
          <ReceiptMock />
        </div>
      </div>
    </div>
  )
}
