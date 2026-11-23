"use client"

import * as React from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { Check, Mic, PenLine } from "lucide-react"

import { SPOKEN } from "@/lib/copy"
import { cn } from "@/lib/utils"

/**
 * "Three steps. No typing." as one small live walkthrough.
 * Step 1: you speak. Step 2: a confirmation card. Step 3: the books update.
 * It plays through once when seen; tap any step to replay just that step.
 */

const STEPS = [
  { id: "say", label: "Say it", note: "Talk like you would to a helper." },
  { id: "check", label: "Check the card", note: "Fix it or confirm it." },
  { id: "books", label: "It’s in the books", note: "Stock, bill and khata update together." },
]

const BARS = 22

export function StepsStage() {
  const [step, setStep] = React.useState(0)
  const [armed, setArmed] = React.useState(0)
  const root = React.useRef<HTMLDivElement>(null)
  const stage = React.useRef<HTMLDivElement>(null)
  const touched = React.useRef(false)
  const tabs = React.useRef<(HTMLButtonElement | null)[]>([])

  // First run: when the section is on screen, walk through all three steps
  React.useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setArmed(1)
          io.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Auto-walk 1 → 2 → 3 once (cancelled the moment the user taps a step)
  React.useEffect(() => {
    if (armed !== 1 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const a = gsap.delayedCall(3.2, () => !touched.current && setStep(1))
    const b = gsap.delayedCall(6.2, () => !touched.current && setStep(2))
    return () => {
      a.kill()
      b.kill()
    }
  }, [armed])

  useGSAP(
    () => {
      if (armed === 0) return
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      const q = gsap.utils.selector(stage.current)
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
      tl.from(q("[data-in]"), { autoAlpha: 0, y: 16, duration: 0.5, stagger: 0.12 })

      if (step === 0) {
        const bars = q("[data-wave]")
        gsap.set(bars, { scaleY: 0.15 })
        const tick = (time: number) => {
          bars.forEach((b, i) => {
            const env = Math.sin((i / (BARS - 1)) * Math.PI) * 0.6 + 0.4
            const v = 0.5 + 0.5 * Math.sin(time * 7 + i * 0.9) * Math.sin(time * 3 + i * 0.4)
            gsap.set(b, { scaleY: Math.max(0.14, v * env + 0.12) })
          })
        }
        gsap.ticker.add(tick)
        gsap.fromTo(q("[data-ring]"), { scale: 1, opacity: 0.5 }, { scale: 1.9, opacity: 0, duration: 1.4, repeat: -1, ease: "power1.out", stagger: 0.7 })
        return () => gsap.ticker.remove(tick)
      }
      if (step === 1) {
        tl.fromTo(q("[data-confirm]"), { scale: 1 }, { scale: 1.06, duration: 0.5, repeat: 3, yoyo: true, ease: "sine.inOut" }, "+=0.2")
      }
      if (step === 2) {
        tl.from(q("[data-tick]"), { scale: 0, duration: 0.4, stagger: 0.25, ease: "back.out(3)" }, 0.5)
        q("[data-count]").forEach((el) => {
          const e = el as HTMLElement
          const o = { v: Number(e.dataset.from) }
          const to = Number(e.dataset.to)
          const p = e.dataset.prefix ?? ""
          e.textContent = p + Math.round(o.v).toLocaleString("en-IN")
          tl.to(o, { v: to, duration: 1, ease: "power2.out", onUpdate: () => void (e.textContent = p + Math.round(o.v).toLocaleString("en-IN")) }, 0.5)
        })
      }
    },
    { scope: stage, dependencies: [step, armed], revertOnUpdate: true }
  )

  const pick = (i: number) => {
    touched.current = true
    if (i === step) setArmed((a) => a + 1)
    else setStep(i)
  }

  const onKey = (e: React.KeyboardEvent) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0
    if (!d) return
    e.preventDefault()
    const n = (step + d + 3) % 3
    pick(n)
    tabs.current[n]?.focus()
  }

  return (
    <div ref={root} className="mt-5 sm:mt-8">
      {/* the three steps, with a line that fills as you go */}
      <div role="tablist" aria-label="How it works" onKeyDown={onKey} className="relative grid grid-cols-3 gap-2">
        <div aria-hidden="true" className="absolute top-[18px] right-[16.6%] left-[16.6%] h-0.5 rounded bg-background/20 sm:top-5">
          <div className="h-full origin-left rounded bg-hl transition-transform duration-700 ease-out" style={{ transform: `scaleX(${step / 2})` }} />
        </div>
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            ref={(el) => {
              tabs.current[i] = el
            }}
            role="tab"
            id={`step-tab-${s.id}`}
            aria-selected={step === i}
            aria-controls="step-panel"
            tabIndex={step === i ? 0 : -1}
            onClick={() => pick(i)}
            className="relative flex flex-col items-center gap-1.5 text-center transition-transform active:scale-95"
          >
            <span
              className={cn(
                "font-display grid size-9 place-items-center rounded-full text-base font-extrabold transition-colors duration-300 sm:size-10",
                i <= step ? "bg-hl text-[#10301f]" : "bg-background/15 text-background/70"
              )}
            >
              {i < step ? <Check className="size-4" /> : i + 1}
            </span>
            <span className={cn("text-xs leading-tight font-semibold transition-opacity sm:text-base", step === i ? "opacity-100" : "opacity-60")}>
              {s.label}
            </span>
          </button>
        ))}
      </div>

      {/* the stage */}
      <div
        ref={stage}
        role="tabpanel"
        id="step-panel"
        aria-labelledby={`step-tab-${STEPS[step].id}`}
        className="mt-4 min-h-[210px] rounded-[1.25rem] bg-[#bfe0f5] p-3.5 text-[#10301f] sm:mt-6 sm:min-h-[240px] sm:p-6 lg:min-h-[260px] lg:rounded-[1.75rem]"
      >
        <div key={step} className="mx-auto flex h-full max-w-[520px] flex-col justify-center gap-3">
          <p data-in className="text-center text-sm font-semibold opacity-70 sm:text-base">
            {STEPS[step].note}
          </p>

          {step === 0 && (
            <>
              <div data-in className="mx-auto flex w-full items-center gap-3 rounded-full bg-[#10301f] p-2 pr-4 text-[#fffef8]">
                <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-signal text-white">
                  <span data-ring className="absolute inset-0 rounded-full bg-signal" />
                  <span data-ring className="absolute inset-0 rounded-full bg-signal" />
                  <Mic className="relative size-5" />
                </span>
                <div aria-hidden="true" className="flex h-8 flex-1 items-center gap-[3px]">
                  {Array.from({ length: BARS }).map((_, i) => (
                    <span key={i} data-wave className="h-full flex-1 origin-center rounded-full bg-current" />
                  ))}
                </div>
              </div>
              <p data-in className={cn("mx-auto w-fit rounded-2xl rounded-tl-sm bg-card px-3.5 py-2 text-sm font-semibold text-foreground sm:text-base")}>
                “{SPOKEN}”
              </p>
            </>
          )}

          {step === 1 && (
            <div data-in className="rounded-2xl bg-paper p-3.5 shadow-[0_14px_30px_-18px_rgb(0_0_0/0.5)] sm:p-4">
              <p className="text-xs font-semibold opacity-60">BolBhai understood</p>
              <div className="mt-2 space-y-1 text-sm sm:text-base">
                <p className="flex justify-between"><span>Create invoice for</span><b>Ramesh</b></p>
                <p className="flex justify-between"><span>Rice 25 kg × 5</span><b className="tabular-nums">₹6,200</b></p>
              </div>
              <div className="mt-3 flex gap-2">
                <span data-confirm className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#10301f] text-sm font-semibold text-[#fffef8]">
                  <Check className="size-4" /> Confirm
                </span>
                <span className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-[#10301f]/25 text-sm font-semibold">
                  <PenLine className="size-4" /> Edit
                </span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div data-in className="space-y-2 rounded-2xl bg-paper p-3.5 text-sm shadow-[0_14px_30px_-18px_rgb(0_0_0/0.5)] sm:p-4 sm:text-base">
              {[
                ["Rice stock", <b key="a" className="tabular-nums"><span data-count data-from="40" data-to="35">35</span> bags</b>],
                ["Invoice No. 0142", <b key="b">Created</b>],
                ["Ramesh owes", <b key="c" className="tabular-nums" data-count data-from="0" data-to="4200" data-prefix="₹">₹4,200</b>],
              ].map(([label, value], i) => (
                <p key={i} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <span data-tick className="grid size-5 place-items-center rounded-full bg-[#28a745] text-white">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    {label}
                  </span>
                  {value}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
