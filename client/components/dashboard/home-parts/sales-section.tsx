"use client"

import * as React from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

import { PERIODS, SERIES, inr } from "@/components/dashboard/home-parts/data"
import { useHomeStore } from "@/store/home-store"
import { useUserStore } from "@/store/user-store"
import { cn } from "@/lib/utils"
import {
  AreaChart,
  Register,
} from "@/components/dashboard/home-parts/chart-parts"

/** Total sales: the period tabs, the number, and a graph you can tap. */
export function SalesSection() {
  const user = useUserStore((s) => s.user)
  const analytics = useHomeStore((s) => s.analytics)
  const period = useHomeStore((s) => s.period)
  const setPeriod = useHomeStore((s) => s.setPeriod)
  const phase = useHomeStore((s) => s.phase)
  const [pick, setPick] = React.useState<number | null>(null)
  const [hov, setHov] = React.useState<number | null>(null)
  const firstRun = React.useRef(true)
  const root = React.useRef<HTMLElement>(null)
  // the server's numbers once they are in; empty bars until then
  const real = analytics?.[period]
  const serie = real
    ? {
        label: real.label,
        total: real.total,
        bills: real.bills,
        delta: real.change === null ? "–" : `${Math.abs(real.change)}%`,
        up: (real.change ?? 0) >= 0,
        vs: real.vs,
        bars: real.bars,
        names: real.names,
      }
    : SERIES[period]
  const nowBar = analytics ? analytics.now[period] : serie.bars.length - 1
  const total = serie.total
  const max = Math.max(1, ...serie.bars)
  // period switch: the pill slides, the bars grow again
  useGSAP(
    () => {
      const q = gsap.utils.selector(root.current)
      const i = PERIODS.findIndex((p) => p.id === period)
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
      gsap.to(q("[data-pill]"), {
        xPercent: i * 100,
        duration: firstRun.current || reduce ? 0 : 0.45,
        ease: "power3.inOut",
      })
      if (firstRun.current) {
        firstRun.current = false
        return
      }
      setPick(null)
      if (!reduce && period === "month")
        gsap.fromTo(
          q("[data-area]"),
          { clipPath: "inset(0 100% 0 0)" },
          {
            clipPath: "inset(0 0% 0 0)",
            duration: 1,
            ease: "power2.inOut",
            clearProps: "clipPath",
          }
        )
      if (!reduce)
        gsap.fromTo(
          q("[data-cbar]"),
          { scaleY: 0 },
          {
            scaleY: 1,
            duration: 0.7,
            stagger: { amount: 0.3 },
            ease: "back.out(1.5)",
            overwrite: true,
          }
        )
    },
    { dependencies: [period], scope: root }
  )

  // while the mic is busy, the graph folds away to make room for the bill
  useGSAP(
    () => {
      const q = gsap.utils.selector(root.current)
      const idle = phase === "idle"
      gsap.to(q("[data-chart]"), {
        flexGrow: idle ? 1 : 0,
        minHeight: idle ? 80 : 0,
        autoAlpha: idle ? 1 : 0,
        duration: 0.5,
        ease: "power3.inOut",
        overwrite: true,
      })
    },
    { dependencies: [phase], scope: root }
  )

  return (
    <section
      ref={root}
      className="relative mt-2 flex min-h-0 flex-1 flex-col sm:mt-5"
    >
      <div
        data-tabs
        role="tablist"
        aria-label="Period"
        className="relative grid h-10 w-full grid-cols-3 rounded-full bg-foreground/[0.07] p-1 sm:w-80 md:h-12"
      >
        <span
          data-pill
          aria-hidden="true"
          className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-foreground"
        />
        {PERIODS.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={period === p.id}
            onClick={() => setPeriod(p.id)}
            className={cn(
              "relative rounded-full text-sm font-semibold transition-colors md:text-base",
              period === p.id ? "text-background" : "text-foreground/70"
            )}
          >
            {p.name}
          </button>
        ))}
      </div>

      <p
        data-hello
        className={cn(
          "mt-3 font-hand text-[1.6rem] leading-none text-signal sm:text-3xl [@media(max-height:760px)]:hidden md:[@media(min-height:900px)]:text-5xl"
        )}
      >
        Hello, {user?.name?.split(" ")[0] ?? "there"}. Total sales {serie.label}
        :
      </p>
      <p
        className="mt-1 text-[3.1rem] leading-[1.05] font-extrabold tabular-nums sm:text-[4.5rem] [@media(max-height:760px)]:text-[2.4rem] md:[@media(min-height:900px)]:text-[6.5rem]"
        style={{ fontVariationSettings: '"wdth" 92' }}
      >
        <Register value={total} />
      </p>
      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground md:text-base">
        <span
          className={cn(
            "font-bold",
            serie.up ? "text-[#3fae6a]" : "text-signal"
          )}
        >
          {serie.up ? "▲" : "▼"} {serie.delta}
        </span>
        vs {serie.vs} · {serie.bills} bills
      </p>

      {/* the graph: tap a bar to read it */}
      <div data-chart className="min-h-[5rem] flex-[1_1_0] overflow-hidden">
        <div className="relative flex h-full flex-col pt-9">
          {/* hover (or tap) a bar: its time and sales appear right above it */}
          {(hov ?? pick) !== null && (
            <div
              role="status"
              className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg bg-foreground px-2.5 py-1 text-center whitespace-nowrap text-background shadow-lg"
              style={{
                left: `clamp(2.9rem, ${((((hov ?? pick) as number) + 0.5) / serie.bars.length) * 100}%, calc(100% - 2.9rem))`,
              }}
            >
              <span className="block text-[10px] leading-tight opacity-70">
                {serie.names[(hov ?? pick) as number]}
              </span>
              <span className="block text-sm leading-tight font-extrabold tabular-nums">
                {inr(serie.bars[(hov ?? pick) as number])}
              </span>
            </div>
          )}
          {period === "month" ? (
            <AreaChart
              key="month"
              values={serie.bars}
              max={max}
              active={hov ?? pick}
              onHover={setHov}
              onPick={(i) => setPick(i === pick ? null : i)}
              label={`Sales ${serie.label}`}
            />
          ) : (
            <div
              className="flex min-h-0 flex-1 items-end gap-[3px] md:gap-1"
              role="group"
              aria-label={`Sales ${serie.label}`}
              onPointerLeave={() => setHov(null)}
            >
              {serie.bars.map((v, i) => {
                const now = i === nowBar
                return (
                  <button
                    key={`${period}-${i}`}
                    type="button"
                    aria-label={`${serie.names[i]}: ${inr(v)}`}
                    onClick={() => setPick(i === pick ? null : i)}
                    onPointerEnter={(e) =>
                      e.pointerType === "mouse" && setHov(i)
                    }
                    onFocus={() => setHov(i)}
                    onBlur={() => setHov(null)}
                    className="group flex h-full min-w-0 flex-1 items-end outline-none"
                  >
                    <span
                      data-cbar
                      style={{
                        height: `${Math.max(6, (v / max) * 100)}%`,
                        transformOrigin: "bottom",
                      }}
                      className={cn(
                        "w-full rounded-t-[4px] transition-[filter] group-hover:brightness-125",
                        i === (hov ?? pick)
                          ? "gbar-on"
                          : now
                            ? "gbar-now"
                            : "gbar"
                      )}
                    />
                  </button>
                )
              })}
            </div>
          )}
          <div className="mt-1 flex text-[11px] text-muted-foreground md:text-xs">
            {period === "week" ? (
              serie.names.map((n) => (
                <span key={n} className="flex-1 text-center">
                  {n.slice(0, 1)}
                </span>
              ))
            ) : (
              <>
                <span>{serie.names[0]}</span>
                <span className="ml-auto">
                  {serie.names[serie.names.length - 1]}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
