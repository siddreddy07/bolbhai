"use client"

import { Illo } from "@/components/site/illo"
import * as React from "react"
import Link from "next/link"
import gsap from "gsap"
import { ChartColumn, MessageSquareText, Package, Plus, Receipt, Truck, Users } from "lucide-react"

import { StepsStage } from "@/components/site/steps-stage"
import { FeatureCarousel, type CarouselItem } from "@/components/ui/feature-carousel"
import { JOB_SAY, langClass, useLang } from "@/lib/lang"
import { cn } from "@/lib/utils"
import { useUserStore } from "@/store/user-store"

const wrap = "mx-auto w-full max-w-[1120px] px-5 sm:px-8"

/* ------------------------------------ Jobs ------------------------------------ */

const row = "flex justify-between text-sm"
const JOBS: CarouselItem[] = [
  {
    id: "stock",
    label: "Stock",
    icon: Package,
    say: "20 bags of rice came in",
    description: "Add what arrives, see what is left, get a nudge before you run out.",
    tone: "bg-sky",
    visual: (
      <>
        <div className="flex justify-between text-sm font-semibold">
          <span>Rice 25 kg</span>
          <span className="tabular-nums">20 → 60 bags</span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#10301f]/10">
          <div className="h-full origin-left rounded-full bg-[#10301f] [animation:loop-fill_3.4s_cubic-bezier(.3,.7,.2,1)_infinite]" />
        </div>
      </>
    ),
  },
  {
    id: "purchases",
    label: "Purchases",
    icon: Truck,
    say: "bought 30 bags of sugar",
    description: "Record what you buy from suppliers and see what you owe them.",
    tone: "bg-card text-foreground",
    visual: (
      <div className="space-y-1.5">
        <div className={row}>
          <span>Sugar 50 kg × 30</span>
          <b className="tabular-nums">₹1,02,000</b>
        </div>
        <div className={cn(row, "text-[#55675b]")}>
          <span>Sri Rama Traders</span>
          <span>due Friday</span>
        </div>
      </div>
    ),
  },
  {
    id: "bills",
    label: "Bills",
    icon: Receipt,
    say: "make a bill for Ramesh",
    description: "Invoices write themselves from what you said, ready to print or share.",
    tone: "bg-hl text-[#10301f]",
    visual: (
      <div className="space-y-1.5">
        {[
          ["Rice 25 kg × 5", "₹6,200"],
          ["Toor dal 1 kg × 10", "₹950"],
        ].map(([r, v], i) => (
          <div
            key={r}
            className={row}
            style={{ animation: "loop-in 3.4s cubic-bezier(.3,.7,.2,1) infinite", animationDelay: `${i * 0.25}s` }}
          >
            <span>{r}</span>
            <span className="tabular-nums">{v}</span>
          </div>
        ))}
        <div className={cn(row, "border-t border-dashed border-[#10301f]/30 pt-1.5 font-bold")}>
          <span>Total</span>
          <span className="tabular-nums">₹7,150</span>
        </div>
      </div>
    ),
  },
  {
    id: "khata",
    label: "Khata",
    icon: Users,
    say: "Ramesh paid two thousand",
    description: "Know who owes what. Payments update the account the moment you say them.",
    tone: "bg-mint",
    visual: (
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold">Ramesh owes</span>
        <span className="font-display relative text-2xl font-extrabold tabular-nums">
          <span className="[animation:swap-a_3.4s_steps(1)_infinite]">₹4,200</span>
          <span className="absolute right-0 [animation:swap-b_3.4s_steps(1)_infinite]">₹2,200</span>
        </span>
      </div>
    ),
  },
  {
    id: "reports",
    label: "Reports",
    icon: ChartColumn,
    say: "show me today's sales",
    description: "See the day at a glance: sales, top items, who bought what.",
    tone: "bg-card text-foreground",
    visual: (
      <div className="flex h-14 items-end gap-2">
        {[0.35, 0.55, 0.45, 0.8, 0.65, 1].map((h, i) => (
          <div
            key={i}
            className="flex-1 origin-bottom rounded-t-md bg-signal"
            style={{
              height: `${h * 100}%`,
              animation: "loop-rise 3.4s cubic-bezier(.3,.7,.2,1) infinite",
              animationDelay: `${i * 0.08}s`,
            }}
          />
        ))}
      </div>
    ),
  },
  {
    id: "ask",
    label: "Ask anything",
    icon: MessageSquareText,
    say: "how much rice is left?",
    description: "Ask a question about your shop and get the answer, not a spreadsheet.",
    tone: "bg-sky",
    visual: (
      <div className="space-y-1.5 text-sm">
        <p className="w-fit rounded-xl bg-[#10301f]/10 px-3 py-1.5">How much rice is left?</p>
        <p className="ml-auto w-fit rounded-xl bg-[#10301f] px-3 py-1.5 text-[#fffef8]">35 bags in stock</p>
      </div>
    ),
  },
]

export function Jobs() {
  const { lang } = useLang()
  const items = JOBS.map((j) => ({
    ...j,
    say: JOB_SAY[j.id][lang],
    sayClass: lang === "en" ? undefined : cn(langClass(lang), "text-base leading-snug font-semibold sm:text-lg lg:text-xl"),
  }))
  return (
    <section id="jobs" className="py-10 sm:py-16 lg:py-24">
      <div className={wrap}>
        <h2 data-reveal className="max-w-[18ch] text-[1.55rem] leading-[1.05] font-extrabold sm:text-[2rem] lg:text-[clamp(2.6rem,4.6vw,3.8rem)] lg:leading-[1]">
          Every job in your shop. Now you just say it.
        </h2>
        <div data-reveal className="mt-5 sm:mt-8 lg:mt-10">
          <FeatureCarousel items={items} />
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------- How ------------------------------------ */

export function How() {
  return (
    <section id="how" className="mx-2 mt-2 flex items-center rounded-[1.5rem] bg-foreground py-10 text-background sm:mx-3 sm:mt-3 sm:rounded-[2rem] sm:py-14 lg:py-20">
      <div className={wrap}>
        <h2 data-reveal className="max-w-[16ch] text-[1.55rem] leading-[1.05] font-extrabold sm:text-[2rem] lg:text-[clamp(2.6rem,4.6vw,3.8rem)] lg:leading-[1]">
          Three steps. No typing.
        </h2>
        <div data-reveal>
          <StepsStage />
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------- FAQ ------------------------------------ */

const QA = [
  ["Do I have to type anything?", "Not really. Talk, look at the slip, press Done. You can still type if you enjoy suffering."],
  ["Which languages does it understand?", "English. Just English. Yes, only one. Others are coming, no dates, dont ask."],
  ["Is my shop’s data separate from other shops?", "Yes. Every shop has its own stuff. The shop next door cant see your bills."],
  ["What if it hears me wrong?", "Then the slip is wrong and you fix it. Nothing is saved till you press Done, so no drama."],
  ["Where can I use it?", "In the browser. Phone, tablet, laptop. Nothing to install, your storage is safe."],
]

function FaqItem({
  q,
  a,
  open,
  onToggle,
  id,
}: {
  q: string
  a: string
  open: boolean
  onToggle: () => void
  id: string
}) {
  const panel = React.useRef<HTMLDivElement>(null)
  const icon = React.useRef<HTMLSpanElement>(null)
  const text = React.useRef<HTMLParagraphElement>(null)
  const first = React.useRef(true)

  // GSAP drives the height, the plus-to-cross and the text arriving.
  React.useEffect(() => {
    const p = panel.current!
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const d = (n: number) => (reduce || first.current ? 0 : n)
    gsap.killTweensOf([p, icon.current, text.current])
    if (open) {
      gsap.set(p, { display: "block" })
      gsap.to(p, { height: "auto", duration: d(0.6), ease: "power3.inOut" })
      gsap.to(icon.current, { rotate: 135, backgroundColor: "#f25c2a", color: "#fff", duration: d(0.5), ease: "back.out(1.6)" })
      gsap.fromTo(
        text.current,
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: d(0.5), delay: d(0.12), ease: "power3.out" }
      )
    } else {
      gsap.to(text.current, { autoAlpha: 0, y: -6, duration: d(0.2), ease: "power2.in" })
      gsap.to(p, {
        height: 0,
        duration: d(0.45),
        ease: "power3.inOut",
        onComplete: () => void gsap.set(p, { display: "none" }),
      })
      gsap.to(icon.current, { rotate: 0, backgroundColor: "rgba(127,127,127,.18)", color: "currentColor", duration: d(0.4), ease: "power3.out" })
    }
    first.current = false
  }, [open])

  return (
    <div data-reveal className="py-1">
      <h3 className="text-[15px] font-semibold sm:text-lg lg:text-xl" style={{ letterSpacing: 0 }}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={onToggle}
          className="group flex w-full items-center justify-between gap-4 py-3 text-left sm:gap-6 sm:py-4"
        >
          <span className="transition-transform duration-300 group-hover:translate-x-1">{q}</span>
          <span
            ref={icon}
            className="grid size-8 shrink-0 place-items-center rounded-full bg-foreground/[0.14] sm:size-9"
          >
            <Plus className="size-4" />
          </span>
        </button>
      </h3>
      <div
        ref={panel}
        id={id}
        role="region"
        inert={!open}
        className="hidden h-0 overflow-hidden"
      >
        <p ref={text} className="max-w-[56ch] pb-4 text-sm leading-relaxed text-foreground/75 sm:text-base">
          {a}
        </p>
      </div>
    </div>
  )
}

export function Faq() {
  const [openIdx, setOpenIdx] = React.useState<number | null>(null)
  return (
    <section id="faq" className="py-10 sm:py-16 lg:py-24">
      <div className={cn(wrap, "grid gap-4 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16")}>
        <h2 data-reveal className="text-[1.55rem] leading-[1.05] sm:text-[2rem] lg:text-[clamp(2.6rem,4.6vw,3.8rem)] lg:leading-[1] font-extrabold">
          Questions shopkeepers ask first.
        </h2>
        <div className="divide-y divide-foreground/12 border-y border-foreground/12">
          {QA.map(([q, a], i) => (
            <FaqItem
              key={q}
              id={`faq-${i}`}
              q={q}
              a={a}
              open={openIdx === i}
              onToggle={() => setOpenIdx(openIdx === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------- CTA ------------------------------------ */

export function Cta() {
  const user = useUserStore((s) => s.user)
  return (
    <section id="cta" className="relative mx-2 mt-2 flex items-center overflow-hidden rounded-[1.5rem] bg-sky py-10 sm:mx-3 sm:mt-3 sm:rounded-[2rem] sm:py-14 lg:py-24">
      <div aria-hidden="true" className="grain pointer-events-none absolute inset-0" />
      <Illo name="happy-customer" className="absolute right-[9%] bottom-0 hidden h-[92%] aspect-[425/880] lg:block" />
      <div data-reveal className={cn(wrap, "relative flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-center lg:gap-8")}>
        <h2 className="max-w-[16ch] text-[1.55rem] leading-[1.05] sm:text-[2rem] lg:text-[clamp(2.6rem,4.6vw,3.8rem)] lg:leading-[1] font-extrabold">
          Say your first bill today.
        </h2>
        <div className="flex w-full gap-2.5 lg:w-auto lg:gap-3">
          <Link
            href={user ? "/dashboard" : "/get-started"}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-foreground px-5 text-sm sm:text-base font-semibold text-background transition-all hover:-translate-y-px hover:shadow-xl active:scale-[.97] lg:h-14 lg:flex-none lg:px-8 lg:text-lg"
          >
            {user ? "Go to shop" : "Start free"}
          </Link>
          <a
            href="#try"
            className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-card px-5 text-sm sm:text-base font-semibold transition-all hover:-translate-y-px active:scale-[.97] lg:h-14 lg:flex-none lg:px-8 lg:text-lg"
          >
            Watch the demo
          </a>
        </div>
      </div>
    </section>
  )
}
