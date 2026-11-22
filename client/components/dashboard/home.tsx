"use client"

import * as React from "react"
import Link from "next/link"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import {
  BookUser,
  Boxes,
  Check,
  Mic,
  ReceiptText,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Logo } from "@/components/site/doodles"
import { ShopMenu } from "@/components/dashboard/header-menus"
import { InvoiceDrawer } from "@/components/dashboard/bills/invoice-slip"
import {
  BillsPanel,
  KhataPanel,
  StockPanel,
} from "@/components/dashboard/panels"
import { MicBars } from "@/components/dashboard/mic-bars"
import { daysAgo } from "@/lib/bill"
import {
  useHomeStore,
  useKhata,
  type Period,
  type SheetKey,
} from "@/store/home-store"
import { LISTENING, langClass, useLang, type Lang } from "@/lib/lang"
import { useUserStore } from "@/store/user-store"
import { cn } from "@/lib/utils"

const inr = (n: number) => "₹" + n.toLocaleString("en-IN")
const HELLO: Record<Lang, string> = { en: "Hello", te: "నమస్తే", hi: "नमस्ते" }

// What the chart shows before the server's numbers arrive: empty bars.
const zeros = (n: number) => Array.from({ length: n }, () => 0)
const SERIES: Record<
  Period,
  {
    label: string
    total: number
    bills: number
    delta: string
    up: boolean
    vs: string
    bars: number[]
    names: string[]
  }
> = {
  day: {
    label: "today",
    total: 0,
    bills: 0,
    delta: "0%",
    up: true,
    vs: "yesterday",
    bars: zeros(12),
    names: [
      "8 am",
      "9 am",
      "10 am",
      "11 am",
      "12 pm",
      "1 pm",
      "2 pm",
      "3 pm",
      "4 pm",
      "5 pm",
      "6 pm",
      "7 pm",
    ],
  },
  week: {
    label: "this week",
    total: 0,
    bills: 0,
    delta: "0%",
    up: true,
    vs: "last week",
    bars: zeros(7),
    names: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
  month: {
    label: "this month",
    total: 0,
    bills: 0,
    delta: "0%",
    up: true,
    vs: "last month",
    bars: zeros(30),
    names: Array.from({ length: 30 }, (_, i) => `${i + 1}`),
  },
}
const PERIODS: { id: Period; name: string }[] = [
  { id: "day", name: "Today" },
  { id: "week", name: "Week" },
  { id: "month", name: "Month" },
]

const TILES: {
  key: Exclude<SheetKey, null>
  label: string
  icon: LucideIcon
  note: string
  tone: string
  tilt: string
}[] = [
  {
    key: "bills",
    label: "Bills",
    icon: ReceiptText,
    note: "",
    tone: "bg-[#f7e33b]",
    tilt: "-rotate-2",
  },
  {
    key: "stock",
    label: "Stock",
    icon: Boxes,
    note: "",
    tone: "bg-[#bfe8c4]",
    tilt: "rotate-1",
  },
  {
    key: "khata",
    label: "Khata",
    icon: BookUser,
    note: "",
    tone: "bg-[#bfe0f5]",
    tilt: "-rotate-1",
  },
]

const SHEETS: Record<
  Exclude<SheetKey, null>,
  { title: string; hint: string }
> = {
  bills: {
    title: "All bills",
    hint: "Every invoice. Or just say “make a bill for…”.",
  },
  stock: {
    title: "Running low",
    hint: "Say “20 bags of rice came in” to update.",
  },
  khata: {
    title: "Who owes you",
    hint: "Tap a name when they pay. Or say “Ramesh paid two thousand”.",
  },
}

/** Smooth line through the points (Catmull-Rom to Bezier). */
function smooth(pts: [number, number][]) {
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`
  }
  return d
}

/** Month view: a smooth area chart you can scrub with a finger or the mouse. */
function AreaChart({
  values,
  max,
  active,
  onHover,
  onPick,
  label,
}: {
  values: number[]
  max: number
  active: number | null
  onHover: (i: number | null) => void
  onPick: (i: number) => void
  label: string
}) {
  const n = values.length
  const W = 300
  const H = 100
  const pts: [number, number][] = values.map((v, i) => [
    (i / (n - 1)) * W,
    H - 8 - (v / max) * (H - 16),
  ])
  const line = smooth(pts)
  const area = `${line} L${W},${H} L0,${H} Z`
  const at = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    return Math.min(
      n - 1,
      Math.max(0, Math.round(((e.clientX - r.left) / r.width) * (n - 1)))
    )
  }
  const ai = active
  return (
    <div
      data-area
      role="group"
      aria-label={label}
      className="relative min-h-0 flex-1 cursor-crosshair touch-pan-y select-none"
      onPointerMove={(e) =>
        (e.pointerType === "mouse" || e.buttons) && onHover(at(e))
      }
      onPointerDown={(e) => onHover(at(e))}
      onPointerUp={(e) => e.pointerType !== "mouse" && onPick(at(e))}
      onPointerLeave={() => onHover(null)}
      onClick={(e) =>
        e.detail > 0 &&
        onPick(at(e as unknown as React.PointerEvent<HTMLDivElement>))
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 size-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
            <stop
              offset="0"
              style={{ stopColor: "var(--g-fill)" }}
              stopOpacity="0.6"
            />
            <stop
              offset="1"
              style={{ stopColor: "var(--g-fill)" }}
              stopOpacity="0"
            />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#areaFill)" />
        <path
          d={line}
          fill="none"
          stroke="var(--g-line)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {/* guide + dot (plain HTML so they never stretch) */}
      {ai !== null && (
        <>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-foreground/30"
            style={{ left: `${(ai / (n - 1)) * 100}%` }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute size-3 -translate-1/2 rounded-full border-2 border-background bg-(--g-dot)"
            style={{
              left: `${(ai / (n - 1)) * 100}%`,
              top: `${(pts[ai][1] / H) * 100}%`,
            }}
          />
        </>
      )}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute size-2.5 -translate-1/2 rounded-full bg-(--g-line)"
        style={{
          left: "100%",
          top: `${(pts[n - 1][1] / H) * 100}%`,
          opacity: ai === null ? 1 : 0.4,
        }}
      />
    </div>
  )
}

/** A cash-register number: only the characters that changed roll in. */
function Register({ value }: { value: number }) {
  const text = inr(value)
  const prev = React.useRef(text)
  const box = React.useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      if (prev.current === text) return
      const old = prev.current
      prev.current = text
      const chars = box.current?.querySelectorAll<HTMLElement>("[data-ch]")
      if (!chars) return
      const off = chars.length - old.length
      const changed = Array.from(chars).filter(
        (el, i) => old[i - off] !== el.textContent
      )
      gsap.fromTo(
        changed,
        { yPercent: 105, autoAlpha: 0 },
        {
          yPercent: 0,
          autoAlpha: 1,
          duration: 0.7,
          ease: "back.out(1.6)",
          stagger: { each: 0.05, from: "end" },
          overwrite: true,
        }
      )
    },
    { dependencies: [text], scope: box }
  )

  return (
    <span ref={box} aria-label={text} className="inline-flex">
      {text.split("").map((c, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="inline-block overflow-hidden pb-[0.08em]"
        >
          <span data-ch className="inline-block">
            {c}
          </span>
        </span>
      ))}
    </span>
  )
}

export function Home() {
  const { lang } = useLang()
  const user = useUserStore((s) => s.user)
  const owed = useKhata().totalDue
  const invoices = useHomeStore((s) => s.invoices)
  const stock = useHomeStore((s) => s.stock)
  const {
    phase,
    transcript,
    setTranscript,
    order,
    finding,
    orderError,
    findItems,
    caption,
    micError,
    sheet,
    analytics,
    period,
    setSheet,
    setPeriod,
    tapMic,
    dismiss,
    pickMatch,
    saveOrderAsBill,
    savingBill,
    draftPayment,
    draftPaymentType,
    setDraftPayment,
  } = useHomeStore()
  const [pick, setPick] = React.useState<number | null>(null)
  const [hov, setHov] = React.useState<number | null>(null)
  const firstRun = React.useRef(true)
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
  const open = sheet ? SHEETS[sheet] : null
  const root = React.useRef<HTMLElement>(null)
  const phrase = LISTENING[lang].split(" ")

  // entrance: one orchestrated moment
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      const q = gsap.utils.selector(root.current)
      const html = document.documentElement
      const go = () =>
        gsap
          .timeline({ defaults: { ease: "power4.out" } })
          .from(q("[data-top]"), { y: -24, autoAlpha: 0, duration: 0.7 })
          .from(
            q("[data-hello]"),
            { y: 14, rotate: -6, autoAlpha: 0, duration: 0.7 },
            0.1
          )
          .from(
            q("[data-ch]"),
            { yPercent: 110, duration: 0.9, stagger: 0.05 },
            0.15
          )
          .from(q("[data-tabs]"), { y: 14, autoAlpha: 0, duration: 0.6 }, 0.2)
          .from(
            q("[data-cbar]"),
            { scaleY: 0, duration: 0.8, stagger: 0.03, ease: "back.out(1.4)" },
            0.6
          )
          .from(
            q("[data-tile]"),
            {
              y: 50,
              scale: 0.8,
              autoAlpha: 0,
              duration: 0.8,
              stagger: 0.09,
              ease: "back.out(1.8)",
            },
            0.35
          )
          .from(
            q("[data-micwrap]"),
            { scale: 0.4, autoAlpha: 0, duration: 0.9, ease: "back.out(2.2)" },
            0.6
          )
      if (html.classList.contains("loading") && !html.dataset.lifted) {
        gsap.set(
          q("[data-top],[data-hello],[data-tabs],[data-tile],[data-micwrap]"),
          { autoAlpha: 0 }
        )
        const start = () => {
          gsap.set(
            q("[data-top],[data-hello],[data-tabs],[data-tile],[data-micwrap]"),
            { clearProps: "visibility,opacity" }
          )
          go()
        }
        window.addEventListener("loader:lift", start, { once: true })
        const t = window.setTimeout(start, 6500)
        return () => {
          window.removeEventListener("loader:lift", start)
          window.clearTimeout(t)
        }
      }
      go()
    },
    { scope: root }
  )

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

  // each phase gets its own little moment
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      const q = gsap.utils.selector(root.current)
      if (phase === "listening") {
        gsap.from(q("[data-word]"), {
          y: 14,
          autoAlpha: 0,
          duration: 0.45,
          stagger: 0.18,
          delay: 0.25,
          ease: "power3.out",
        })
      }
      if (phase === "confirm") {
        // the bill prints out, top to bottom
        gsap.fromTo(
          q("[data-slip]"),
          { clipPath: "inset(0 0 100% 0)", y: -16 },
          {
            clipPath: "inset(0 0 0% 0)",
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            clearProps: "clipPath,transform",
          }
        )
        gsap.from(q("[data-slip] [data-line]"), {
          autoAlpha: 0,
          y: 8,
          duration: 0.4,
          stagger: 0.12,
          delay: 0.25,
        })
      }
    },
    { dependencies: [phase], scope: root }
  )

  return (
    <main
      ref={root}
      className="relative mx-auto flex h-dvh max-w-[520px] flex-col overflow-hidden px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8 sm:pt-5 md:max-w-[720px] md:px-12 md:pt-8"
    >
      <div
        aria-hidden="true"
        className="halftone pointer-events-none absolute -top-10 -right-12 size-56 [mask-image:radial-gradient(circle,#000,transparent_70%)] text-foreground/10"
      />

      {/* top: the shop, and a tiny menu */}
      <header data-top className="relative flex items-center justify-between">
        <ShopMenu />
        <Link href="/" aria-label="BolBhai home" className="shrink-0 pl-2">
          <Logo className="[&_img]:h-9" />
        </Link>
      </header>

      {/* total sales: period tabs, the number, a graph you can tap */}
      <section className="relative mt-2 flex min-h-0 flex-1 flex-col sm:mt-5">
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
            "mt-3 font-hand text-[1.6rem] leading-none text-signal sm:text-3xl [@media(max-height:760px)]:hidden md:[@media(min-height:900px)]:text-5xl",
            langClass(lang)
          )}
        >
          {HELLO[lang]}, {user?.name?.split(" ")[0] ?? "there"}. Total sales{" "}
          {serie.label}:
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

      {/* sticky notes: tap one, a small sheet slides up. No new screens. */}
      <nav
        aria-label="Quick look"
        className="relative mt-3 grid grid-cols-3 gap-2.5 sm:mt-6 sm:gap-4 [@media(max-height:760px)]:mt-2 md:[@media(min-height:900px)]:mt-10 md:[@media(min-height:900px)]:gap-6"
      >
        {TILES.map((t) => (
          <button
            key={t.key}
            data-tile
            type="button"
            onClick={() => setSheet(t.key)}
            className={cn(
              "relative flex h-[5.25rem] flex-col items-start justify-between rounded-[0.9rem] p-3 text-left text-[#10301f] shadow-[0_10px_24px_-14px_rgb(0_0_0/0.55)] transition-[translate,rotate,scale] duration-300 hover:-translate-y-0.5 hover:rotate-0 active:scale-[.94] sm:h-24 [@media(max-height:760px)]:h-[4.25rem] md:[@media(min-height:900px)]:h-40 md:[@media(min-height:900px)]:p-5",
              t.tone,
              t.tilt
            )}
          >
            <span
              aria-hidden="true"
              className="absolute -top-2 left-1/2 h-4 w-10 -translate-x-1/2 -rotate-3 bg-white/55 backdrop-blur-[1px]"
            />
            <t.icon className="size-5 sm:size-6" />
            <span>
              <span className="block font-hand text-[1.7rem] leading-[0.9] sm:text-3xl md:[@media(min-height:900px)]:text-5xl">
                {t.label}
              </span>
              <span className="block text-[11px] font-semibold opacity-70 sm:text-xs md:[@media(min-height:900px)]:text-sm">
                {t.key === "bills"
                  ? `${invoices.filter((i) => daysAgo(i.date) === 0).length} today`
                  : t.key === "khata"
                    ? `${inr(owed)} due`
                    : `${stock.filter((i) => i.qty / i.max < 0.2).length} running low`}
              </span>
            </span>
          </button>
        ))}
      </nav>

      {/* what the voice just did */}
      <section
        aria-live="polite"
        className={cn(
          "relative flex items-center justify-center",
          phase === "idle" ? "h-0" : "min-h-0 flex-1 py-2"
        )}
      >
        {phase === "listening" && (
          <p
            className={cn(
              "max-w-[24ch] text-center text-xl leading-snug font-bold sm:text-2xl md:[@media(min-height:900px)]:text-4xl",
              langClass(lang)
            )}
          >
            {caption
              ? `“${caption}”`
              : phrase.map((w, i) => (
                  <span key={i} data-word className="inline-block">
                    {w}&nbsp;
                  </span>
                ))}
          </p>
        )}

        {phase === "thinking" && (
          <p className="animate-pulse font-hand text-3xl">
            Got it. Writing it down…
          </p>
        )}

        {phase === "confirm" && (
          <div className="relative z-10 flex w-full max-w-[340px] flex-col gap-3">
            <div
              data-slip
              className="relative bg-[#fffef8] [mask-image:conic-gradient(from_-45deg_at_bottom,#0000,#000_1deg_89deg,#0000_90deg)] [mask-size:16px_100%] [mask-position:50%] px-5 pt-4 pb-6 text-[#10301f] shadow-[0_18px_40px_-18px_rgb(0_0_0/0.7)]"
            >
              <textarea
                data-line
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={2}
                placeholder="Type it here, like 1 kg sugar"
                aria-label="What you said. Tap to fix it or type."
                className="mb-2 w-full resize-none rounded-lg border border-dashed border-[#10301f]/30 bg-transparent px-2 py-1.5 text-base leading-snug outline-none focus:border-[#10301f] focus:bg-white/60"
              />
              <p
                data-line
                className="font-hand text-2xl leading-none opacity-70"
              >
                Your order
              </p>
              {order?.length ? (
                <ul
                  data-line
                  className="max-h-[38dvh] overflow-y-auto overscroll-contain border-b border-dashed border-[#10301f]/30 pb-2 text-sm"
                >
                  {order.map((line) => (
                    <li key={line.query} className="py-1">
                      <span className="font-bold">
                        {line.quantity} {line.unit} {line.query}
                      </span>
                      {line.matches.length ? (
                        <span
                          role="radiogroup"
                          aria-label={`Which ${line.query}`}
                          className="mt-1 flex flex-wrap gap-1"
                        >
                          {line.matches.slice(0, 4).map((m, i) => (
                            <button
                              key={m.id}
                              type="button"
                              role="radio"
                              aria-checked={line.pick === i}
                              onClick={() => pickMatch(line.query, i)}
                              className={cn(
                                "rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
                                line.pick === i
                                  ? "border-[#10301f] bg-[#10301f] text-[#f8f8f3]"
                                  : "border-[#10301f]/25 hover:bg-[#10301f]/10"
                              )}
                            >
                              {m.name}
                              {m.size ? ` ${m.size}` : ""} · ₹{m.price}
                            </button>
                          ))}
                        </span>
                      ) : (
                        <span className="block text-xs opacity-60">
                          not on your shelf
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p
                  data-line
                  className="border-b border-dashed border-[#10301f]/30 pb-2 text-sm opacity-70"
                >
                  Tap Confirm to find the items.
                </p>
              )}
              {order?.length ? (
                <div data-line className="mt-3 grid gap-1.5">
                  <div
                    role="radiogroup"
                    aria-label="Payment"
                    className="grid grid-cols-2 gap-1.5"
                  >
                    {(["PAID", "LEDGER"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        role="radio"
                        aria-checked={draftPayment === p}
                        onClick={() => setDraftPayment(p, draftPaymentType)}
                        className={cn(
                          "h-9 rounded-full border text-sm font-semibold transition-colors",
                          draftPayment === p
                            ? "border-[#10301f] bg-[#10301f] text-[#f8f8f3]"
                            : "border-[#10301f]/25 hover:bg-[#10301f]/10"
                        )}
                      >
                        {p === "PAID" ? "Paid" : "Not paid"}
                      </button>
                    ))}
                  </div>
                  <div
                    role="radiogroup"
                    aria-label="Payment type"
                    className="grid grid-cols-2 gap-1.5"
                  >
                    {(["CASH", "UPI"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={draftPaymentType === t}
                        onClick={() => setDraftPayment(draftPayment, t)}
                        className={cn(
                          "h-9 rounded-full border text-sm font-semibold transition-colors",
                          draftPaymentType === t
                            ? "border-[#10301f] bg-[#10301f] text-[#f8f8f3]"
                            : "border-[#10301f]/25 hover:bg-[#10301f]/10"
                        )}
                      >
                        {t === "CASH" ? "Cash" : "UPI"}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {orderError && (
                <p className="mt-2 text-sm font-semibold text-signal">
                  {orderError}
                </p>
              )}
            </div>

            {/* the buttons sit outside the torn paper, so nothing can cover or clip them */}
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Button
                onClick={order ? () => saveOrderAsBill() : findItems}
                disabled={
                  finding ||
                  savingBill ||
                  (!order && !transcript.trim()) ||
                  (!!order && !order.some((l) => l.matches.length))
                }
                className="h-12 rounded-full text-base"
              >
                <Check className="size-5" />{" "}
                {finding
                  ? "Finding items…"
                  : savingBill
                    ? "Saving…"
                    : order
                      ? "Done"
                      : "Confirm"}
              </Button>
              <Button
                onClick={dismiss}
                variant="outline"
                className="h-12 rounded-full px-5 text-base"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* the mic lives where the thumb already is */}
      <div
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
          {micError ??
            (phase === "listening" ? "Tap to stop" : "Tap and say it")}
        </p>
      </div>

      {/* shadcn Drawer: drag it down or tap outside to close */}
      <InvoiceDrawer />
      <Drawer
        open={!!sheet}
        onOpenChange={(o) => !o && setSheet(null)}
        showSwipeHandle
      >
        <DrawerContent className="mx-auto max-w-[520px] md:max-w-[720px]">
          {open && (
            <div className="px-5 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <DrawerHeader className="p-0 pb-2 text-left">
                <DrawerTitle className="font-hand text-4xl leading-none font-semibold">
                  {open.title}
                </DrawerTitle>
                <DrawerDescription>{open.hint}</DrawerDescription>
              </DrawerHeader>
              {sheet === "bills" && <BillsPanel />}
              {sheet === "khata" && <KhataPanel />}
              {sheet === "stock" && <StockPanel />}
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </main>
  )
}
