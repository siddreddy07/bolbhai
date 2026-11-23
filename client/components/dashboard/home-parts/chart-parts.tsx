"use client"

import * as React from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

import { inr } from "@/components/dashboard/home-parts/data"

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
export function AreaChart({
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
export function Register({ value }: { value: number }) {
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
