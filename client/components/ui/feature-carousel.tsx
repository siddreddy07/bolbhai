"use client"

import * as React from "react"
import gsap from "gsap"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export type CarouselItem = {
  id: string
  label: string
  icon: LucideIcon
  /** what the shopkeeper says: only for the jobs that are done by voice */
  say?: string
  /** optional classes for the spoken line (e.g. a script font) */
  sayClass?: string
  description: string
  /** card background classes */
  tone: string
  /** small live UI shown inside the card */
  visual: React.ReactNode
}

const INTERVAL = 3600
const ITEM_H = 60

const wrap = (min: number, max: number, v: number) => {
  const size = max - min
  return ((((v - min) % size) + size) % size) + min
}

/**
 * Rolling chip list (desktop only) + a stack of cards (all sizes).
 * Driven by GSAP; autoplay pauses on hover, off screen and when the tab is hidden.
 */
export function FeatureCarousel({
  items,
  className,
}: {
  items: CarouselItem[]
  className?: string
}) {
  const n = items.length
  const [index, setIndex] = React.useState(0)
  const [paused, setPaused] = React.useState(false)
  const [visible, setVisible] = React.useState(true)
  const root = React.useRef<HTMLDivElement>(null)
  const chips = React.useRef<(HTMLDivElement | null)[]>([])
  const cards = React.useRef<(HTMLDivElement | null)[]>([])
  const first = React.useRef(true)

  const go = React.useCallback((i: number) => setIndex(((i % n) + n) % n), [n])

  // Position everything whenever the active item changes
  React.useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const dur = first.current || reduce ? 0 : 0.75
    first.current = false
    items.forEach((_, i) => {
      const d = wrap(-n / 2, n / 2, i - index)
      const chip = chips.current[i]
      if (chip) {
        gsap.to(chip, {
          y: d * ITEM_H,
          opacity: 1 - Math.min(Math.abs(d), 3) * 0.25,
          duration: dur,
          ease: "power3.out",
          overwrite: true,
        })
      }
      const card = cards.current[i]
      if (card) {
        const active = d === 0
        const side = Math.abs(d) === 1
        gsap.to(card, {
          xPercent: active ? 0 : d < 0 ? (side ? -42 : 0) : side ? 42 : 0,
          scale: active ? 1 : side ? 0.84 : 0.7,
          rotate: active ? 0 : side ? d * 3 : 0,
          opacity: active ? 1 : side ? 0.5 : 0,
          zIndex: active ? 20 : side ? 10 : 0,
          duration: dur,
          ease: "power3.out",
          overwrite: true,
        })
      }
    })
  }, [index, items, n])

  // Autoplay: only while visible, not hovered, tab shown, motion allowed
  React.useEffect(() => {
    if (paused || !visible) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const t = window.setInterval(() => setIndex((i) => (i + 1) % n), INTERVAL)
    return () => window.clearInterval(t)
  }, [paused, visible, n])

  React.useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Swipe
  const startX = React.useRef<number | null>(null)
  const onDown = (e: React.PointerEvent) => {
    startX.current = e.clientX
  }
  const onUp = (e: React.PointerEvent) => {
    if (startX.current === null) return
    const dx = e.clientX - startX.current
    startX.current = null
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1))
  }

  return (
    <div
      ref={root}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-[1.5rem] border border-foreground/10 lg:h-[520px] lg:flex-row lg:rounded-[2.5rem]",
        className
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Rolling chips: desktop only */}
      <div className="relative hidden w-[38%] shrink-0 items-center overflow-hidden bg-[#10301f] px-10 lg:flex dark:bg-[#1b3a2b]">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b from-[#10301f] to-transparent dark:from-[#1b3a2b]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-[#10301f] to-transparent dark:from-[#1b3a2b]" />
        <div className="relative h-full w-full">
          {items.map((it, i) => {
            const Icon = it.icon
            const active = i === index
            return (
              <div
                key={it.id}
                ref={(el) => {
                  chips.current[i] = el
                }}
                className="absolute top-1/2 left-0 -mt-[26px]"
              >
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-current={active}
                  className={cn(
                    "flex items-center gap-3 rounded-full border px-6 py-3.5 text-left whitespace-nowrap transition-colors duration-500",
                    active
                      ? "border-[var(--hl)] bg-[var(--hl)] text-[#10301f]"
                      : "border-white/20 text-white/70 hover:border-white/50 hover:text-white"
                  )}
                >
                  <Icon className="size-[18px]" />
                  <span className="text-[15px] font-semibold">{it.label}</span>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Card stack: every size */}
      <div className="relative flex-1 bg-secondary px-3 pt-5 pb-3 sm:pt-7 lg:flex lg:flex-col lg:justify-center lg:px-10 lg:py-8">
        <div aria-hidden="true" className="halftone pointer-events-none absolute -top-8 -right-8 size-44 text-foreground/10 [mask-image:radial-gradient(circle,#000,transparent_70%)]" />
        <div
          role="group"
          aria-roledescription="carousel"
          aria-label="What BolBhai does"
          className="relative h-[290px] touch-pan-y select-none sm:h-[330px] lg:h-[400px]"
          onPointerDown={onDown}
          onPointerUp={onUp}
          onPointerCancel={() => (startX.current = null)}
        >
          {items.map((it, i) => {
            const active = i === index
            return (
              <div
                key={it.id}
                ref={(el) => {
                  cards.current[i] = el
                }}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${n}: ${it.label}`}
                aria-hidden={!active}
                inert={!active}
                className={cn(
                  "absolute inset-0 m-auto flex h-full w-[76%] max-w-[360px] flex-col justify-between gap-3 overflow-hidden rounded-[1.5rem] border-4 border-background p-4 will-change-transform sm:w-[62%] sm:p-5 lg:w-[360px] lg:rounded-[2rem] lg:p-6",
                  it.tone
                )}
              >
                <div>
                  {it.say && <p className={cn("opacity-70", it.sayClass ?? "font-hand text-xl leading-none sm:text-2xl lg:text-3xl")}>“{it.say}”</p>}
                  <h3 className="mt-2 text-xl font-extrabold sm:text-2xl lg:text-3xl">{it.label}</h3>
                  <p className="mt-1 text-sm leading-snug opacity-75 sm:text-[15px] lg:text-base">{it.description}</p>
                </div>
                <div
                  aria-hidden="true"
                  className="rounded-2xl bg-paper p-3 text-[#10301f] sm:p-4"
                >
                  {it.visual}
                </div>
              </div>
            )
          })}
        </div>

        {/* dots */}
        <div className="relative mt-1 flex justify-center lg:hidden">
          {items.map((it, i) => (
            <button
              key={it.id}
              type="button"
              aria-label={`Show ${it.label}`}
              aria-current={i === index}
              onClick={() => go(i)}
              className="grid h-8 w-6 place-items-center"
            >
              <span
                className={cn(
                  "h-1.5 rounded-full bg-foreground transition-all duration-300",
                  i === index ? "w-5 opacity-100" : "w-1.5 opacity-25"
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FeatureCarousel
