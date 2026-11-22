"use client"

import { motion } from "motion/react"
import * as React from "react"
import Link from "next/link"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ArrowLeft, Search } from "lucide-react"

import { Logo } from "@/components/site/doodles"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN")

/* ---------- the full-page frame every "view all" screen shares ---------- */

export function ListScreen({
  title,
  count,
  controls,
  children,
  wide,
}: {
  title: string
  count: string
  controls: React.ReactNode
  children: React.ReactNode
  wide?: boolean
}) {
  const root = React.useRef<HTMLElement>(null)
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      gsap.from("[data-ls]", {
        y: 18,
        autoAlpha: 0,
        duration: 0.55,
        stagger: 0.07,
        ease: "power3.out",
      })
    },
    { scope: root }
  )
  return (
    <main
      ref={root}
      className={cn(
        "relative mx-auto flex h-dvh max-w-[720px] flex-col px-4 pt-3 sm:px-8 sm:pt-5",
        wide && "lg:max-w-[1120px]"
      )}
    >
      <header data-ls className="flex items-center gap-2">
        <Link
          href="/dashboard"
          aria-label="Back to home"
          className="grid size-11 shrink-0 place-items-center rounded-full border border-foreground/15 transition-transform active:scale-90"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-xl leading-none font-extrabold sm:text-2xl">
            {title}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">{count}</p>
        </div>
        <Link
          href="/dashboard"
          aria-label="BolBhai home"
          className="ml-auto shrink-0 pl-2"
        >
          <Logo className="[&_img]:h-9" />
        </Link>
      </header>
      <div data-ls className="mt-3 grid gap-2.5">
        {controls}
      </div>
      {children}
    </main>
  )
}

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 opacity-50" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-full border border-foreground/15 bg-card pr-4 pl-10 text-base transition-[border-color,box-shadow] outline-none placeholder:text-foreground/40 focus:border-foreground"
      />
    </label>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  compact = false,
}: {
  value: T
  onChange: (v: T) => void
  options: { id: T; name: string }[]
  label: string
  /** a slimmer bar, for small panels */
  compact?: boolean
}) {
  // every bar has its own id, so two bars on a page never share their gliding pill
  const pill = React.useId()
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "grid auto-cols-fr grid-flow-col rounded-full bg-foreground/[0.07]",
        compact ? "p-0.5" : "p-1"
      )}
    >
      {options.map((o) => {
        const on = value === o.id
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.id)}
            className={cn(
              "relative rounded-full font-semibold whitespace-nowrap transition-colors duration-200",
              compact ? "h-8 px-2 text-[13px]" : "h-9 px-3 text-sm",
              on ? "text-background" : "text-foreground/70"
            )}
          >
            {on && (
              <motion.span
                layoutId={pill}
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-foreground"
                transition={{
                  type: "spring",
                  stiffness: 520,
                  damping: 38,
                  mass: 0.8,
                }}
              />
            )}
            <span className="relative">{o.name}</span>
          </button>
        )
      })}
    </div>
  )
}

export function Chips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { id: T; name: string }[]
}) {
  return (
    <div className="flex [scrollbar-width:none] gap-1.5 overflow-x-auto">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "h-8 shrink-0 rounded-full border px-3 text-xs font-semibold",
            value === o.id
              ? "border-foreground bg-foreground text-background"
              : "border-foreground/20"
          )}
        >
          {o.name}
        </button>
      ))}
    </div>
  )
}

/* ---------- hundreds of rows: render in batches as you scroll ---------- */

export function useBatches<T>(items: T[], resetKey: string, step = 30) {
  const [state, setState] = React.useState({ key: resetKey, n: step })
  const n = state.key === resetKey ? state.n : step
  const sentinel = React.useRef<HTMLDivElement>(null)
  const more = n < items.length

  React.useEffect(() => {
    const el = sentinel.current
    if (!el || !more) return
    const io = new IntersectionObserver(
      ([e]) =>
        e.isIntersecting &&
        setState((s) => ({
          key: resetKey,
          n: (s.key === resetKey ? s.n : step) + step,
        })),
      { rootMargin: "300px" }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [more, n, resetKey, step])

  return { shown: items.slice(0, n), more, sentinel }
}

export function Sentinel({
  more,
  innerRef,
  left,
}: {
  more: boolean
  innerRef: React.RefObject<HTMLDivElement | null>
  left: number
}) {
  if (!more) return null
  return (
    <div
      ref={innerRef}
      className="py-4 text-center text-xs text-muted-foreground"
    >
      Loading {left} more…
    </div>
  )
}

/* ---------- by-hand actions (no voice needed) ---------- */

/** Record that a customer paid some of their khata. */
export function PayForm({
  due,
  onSave,
}: {
  due: number
  onSave: (amount: number, mode: "Cash" | "UPI") => void
}) {
  const [amount, setAmount] = React.useState(String(due))
  const [mode, setMode] = React.useState<"Cash" | "UPI">("Cash")
  const value = Number(amount) || 0
  const bad = value <= 0 || value > due
  return (
    <div className="mb-3 rounded-2xl bg-foreground/[0.05] p-3">
      <label
        className="text-xs font-semibold text-muted-foreground"
        htmlFor="pay"
      >
        They paid
      </label>
      <div className="mt-1 flex items-center gap-2 rounded-xl border border-foreground/20 bg-background px-3">
        <span className="text-lg font-bold">₹</span>
        <input
          id="pay"
          inputMode="numeric"
          value={amount}
          onChange={(e) =>
            setAmount(e.target.value.replace(/\D/g, "").slice(0, 7))
          }
          className="h-11 w-full bg-transparent text-xl font-extrabold tabular-nums outline-none"
        />
      </div>
      {value > due && (
        <p className="mt-1 text-xs font-medium text-signal">
          That’s more than they owe. Generous.
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {(
          [
            ["Full", due],
            ["Half", Math.round(due / 2)],
            ["₹500", 500],
            ["₹1,000", 1000],
          ] as [string, number][]
        )
          .filter(([, v]) => v <= due)
          .map(([l, v]) => (
            <button
              key={l}
              type="button"
              onClick={() => setAmount(String(v))}
              className="h-8 rounded-full border border-foreground/20 px-3 text-xs font-semibold active:bg-foreground/10"
            >
              {l}
            </button>
          ))}
      </div>
      <div className="mt-2.5 grid grid-cols-[auto_1fr] items-center gap-2">
        <div
          role="radiogroup"
          aria-label="How"
          className="flex rounded-full bg-foreground/[0.08] p-0.5"
        >
          {(["Cash", "UPI"] as const).map((m) => (
            <button
              key={m}
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "h-9 rounded-full px-3.5 text-sm font-semibold",
                mode === m
                  ? "bg-foreground text-background"
                  : "text-foreground/70"
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <Button
          onClick={() => !bad && onSave(value, mode)}
          disabled={bad}
          className="h-11 rounded-full text-base"
        >
          Record {!bad ? inr(value) : "payment"}
        </Button>
      </div>
    </div>
  )
}
