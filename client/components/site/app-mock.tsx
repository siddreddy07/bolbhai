import * as React from "react"
import {
  ArrowLeft,
  BookUser,
  Boxes,
  Camera,
  Check,
  ChevronDown,
  Cookie,
  Mic,
  Minus,
  Plus,
  Receipt,
  Search,
  SlidersHorizontal,
  Trash2,
  Wheat,
} from "lucide-react"

import { cn } from "@/lib/utils"

/*
 * Small, code-drawn copies of the real app screens, so the home page shows what BolBhai looks like
 * without screenshots: crisp at any size, no image to load. They are dark app screens on purpose,
 * whatever the site theme is. Sizes are in em so a screen scales by setting one font-size on it.
 */

const screen =
  "relative overflow-hidden rounded-t-[1.1em] border border-b-0 border-white/10 bg-[#0a0d0b] text-[#f2f2e8] text-left [background-image:radial-gradient(120%_40%_at_50%_0%,rgb(22_70_46/0.55),transparent_70%)]"

function Top({ title, sub }: { title?: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 px-[1.1em] pt-[1em]">
      {title ? (
        <div className="flex items-center gap-[0.6em]">
          <span className="grid size-[2.3em] place-items-center rounded-full border border-white/15">
            <ArrowLeft className="size-[1.1em]" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-[1.3em] font-extrabold">{title}</p>
            <p className="text-[0.8em] text-white/60">{sub}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-[0.6em]">
          <span className="grid size-[2.2em] place-items-center rounded-full bg-[#f7e33b] text-[1em] font-bold text-[#10301f]">
            S
          </span>
          <span className="text-[1em] font-semibold whitespace-nowrap">
            Santa House
          </span>
          <ChevronDown className="size-[1em] text-white/60" />
        </div>
      )}
      <span className="flex items-center gap-[0.4em]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mascot/bolbhai-logo.png"
          alt=""
          width={120}
          height={152}
          className="h-[2em] w-auto"
        />
        <span className="font-display text-[1.2em] font-extrabold">
          BolBhai
        </span>
      </span>
    </div>
  )
}

function Tape() {
  return (
    <span
      aria-hidden="true"
      className="absolute -top-[0.55em] left-1/2 h-[1.1em] w-[3.2em] -translate-x-1/2 -rotate-2 bg-white/40"
    />
  )
}

/** The home screen: today's sales, the day by the hour, and the three ways in. */
export function DashboardMock({ className }: { className?: string }) {
  return (
    <div className={cn(screen, className)} aria-hidden="true">
      <Top />
      <div className="mx-[1.1em] mt-[1em] inline-flex rounded-full bg-white/8 p-[0.25em] text-[0.95em] font-semibold">
        <span className="rounded-full bg-[#f2f2e8] px-[1.1em] py-[0.5em] text-[#10301f]">
          Today
        </span>
        <span className="px-[1.1em] py-[0.5em] text-white/70">Week</span>
        <span className="px-[1.1em] py-[0.5em] text-white/70">Month</span>
      </div>
      <div className="px-[1.1em]">
        <p className="mt-[0.5em] font-hand text-[1.35em] leading-tight text-[#f25c2a]">
          Hello, Siddharth. Total sales today:
        </p>
        <p className="font-display text-[3.2em] leading-[1.05] font-extrabold tabular-nums">
          ₹1,000
        </p>
        <p className="mt-[0.2em] text-[0.9em] text-white/65">
          <span className="text-[#3ddc84]">▲ –</span> vs yesterday · 1 bills
        </p>
        <div className="mt-[1.6em] flex h-[8em] items-end gap-[0.3em]">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "flex-1 rounded-[0.25em]",
                i === 10
                  ? "h-full bg-gradient-to-b from-[#45d98a] to-[#1d6b43]"
                  : "h-[0.35em] bg-[#1d4a33]"
              )}
            />
          ))}
        </div>
        <div className="mt-[0.4em] flex justify-between text-[0.7em] text-white/55">
          <span>12 am</span>
          <span>10 pm</span>
        </div>
        <div className="mt-[1.6em] grid grid-cols-3 gap-[0.7em] text-[#10301f]">
          {[
            [Receipt, "Bills", "1 today", "bg-[#f7e33b] -rotate-[1.5deg]"],
            [Boxes, "Stock", "0 running low", "bg-[#bfe8c4] rotate-[1deg]"],
            [BookUser, "Khata", "₹1,000 due", "bg-[#bfe0f5] -rotate-[0.8deg]"],
          ].map(([I, label, sub, tone]) => {
            const Icon = I as typeof Receipt
            return (
              <div
                key={label as string}
                className={cn(
                  "relative rounded-[0.8em] px-[0.8em] pt-[1em] pb-[0.8em]",
                  tone as string
                )}
              >
                <Tape />
                <Icon className="size-[1.4em]" />
                <p className="mt-[0.15em] font-hand text-[1.6em] leading-none">
                  {label as string}
                </p>
                <p className="mt-[0.2em] text-[0.7em] opacity-70">
                  {sub as string}
                </p>
              </div>
            )
          })}
        </div>
        <div className="mt-[1.4em] flex flex-col items-center pb-[1.5em]">
          <span className="grid size-[4.2em] place-items-center rounded-full bg-[#f25c2a] text-white shadow-[0_0_2.4em_rgb(242_92_42/0.45)]">
            <Mic className="size-[1.8em]" />
          </span>
          <p className="mt-[0.6em] text-[0.85em] text-white/60">
            Tap and say it
          </p>
        </div>
      </div>
    </div>
  )
}

/** Khata: every unpaid bill, with the buttons to settle it. */
export function KhataMock({ className }: { className?: string }) {
  return (
    <div className={cn(screen, className)} aria-hidden="true">
      <Top title="Khata" sub="1 unpaid bill" />
      <div className="mx-[1.1em] mt-[0.9em] flex items-center gap-[0.6em] rounded-full border border-white/12 bg-white/5 px-[1em] py-[0.8em] text-[0.95em] text-white/50">
        <Search className="size-[1.1em]" /> Search an item on a bill
      </div>
      <div className="mx-[1.1em] mt-[0.7em] flex gap-[0.5em] text-[0.8em] font-semibold">
        <span className="rounded-full bg-[#f2f2e8] px-[1em] py-[0.5em] text-[#10301f]">
          All unpaid
        </span>
        <span className="rounded-full border border-white/20 px-[1em] py-[0.5em]">
          14+ days late
        </span>
      </div>
      <div className="px-[1.1em]">
        <p className="mt-[1.1em] text-[0.8em] text-white/60">
          Total to collect
        </p>
        <p className="font-display text-[2.1em] leading-tight font-extrabold">
          ₹1,000
        </p>
        <div className="mt-[0.9em] flex items-start justify-between gap-2">
          <div className="min-w-0 leading-tight">
            <p className="text-[0.95em] font-semibold">
              India Gate Basmati rice (raw), Karachi Bakery Osmania Biscuit
            </p>
            <p className="mt-[0.2em] text-[0.75em] text-white/55">
              10 items · today
            </p>
          </div>
          <p className="flex shrink-0 items-center gap-[0.2em] text-[0.95em] font-semibold">
            ₹1,000 <ChevronDown className="size-[1em] text-white/60" />
          </p>
        </div>
        <div className="mt-[0.8em] rounded-[1em] bg-white/6 p-[0.8em] pb-[1.1em] text-[0.8em]">
          <p className="flex justify-between">
            <span>6 × India Gate Basmati rice (raw) 1kg</span>
            <span className="text-white/70">₹600</span>
          </p>
          <p className="mt-[0.3em] flex justify-between">
            <span>4 × Karachi Bakery Osmania Biscuit 400g</span>
            <span className="text-white/70">₹400</span>
          </p>
          <div className="mt-[0.9em] grid grid-cols-3 gap-[0.5em] text-[1em] font-semibold">
            <span className="flex items-center justify-center gap-[0.3em] rounded-full bg-[#f2f2e8] py-[0.8em] text-[#10301f]">
              <Check className="size-[1em]" /> Cash
            </span>
            <span className="flex items-center justify-center gap-[0.3em] rounded-full bg-[#f2f2e8] py-[0.8em] text-[#10301f]">
              <Check className="size-[1em]" /> UPI
            </span>
            <span className="flex items-center justify-center rounded-full border border-white/20 py-[0.8em]">
              Open bill
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Stock: what is on the shelf, with its count, pack size and price. */
export function StockMock({ className }: { className?: string }) {
  const items = [
    {
      name: "India Gate Basmati rice (raw)",
      Icon: Wheat,
      bg: "bg-[#f7e33b]",
      pack: "1kg",
      n: 6,
      packBg: "bg-[#f7e33b] text-[#10301f]",
    },
    {
      name: "Karachi Bakery Osmania Biscuit",
      Icon: Cookie,
      bg: "bg-[#ddd2f7]",
      pack: "400g",
      n: 22,
      packBg: "bg-[#ddd2f7] text-[#10301f]",
    },
  ]
  return (
    <div className={cn(screen, className)} aria-hidden="true">
      <Top title="Stock" sub="2 items · 0 running low" />
      <div className="mx-[1.1em] mt-[0.9em] flex gap-[0.5em] text-[0.95em]">
        <span className="flex flex-1 items-center gap-[0.6em] rounded-full border border-white/12 bg-white/5 px-[1em] py-[0.8em] text-white/50">
          <Search className="size-[1.1em]" /> Search an item
        </span>
        <span className="flex items-center gap-[0.4em] rounded-full border border-white/12 bg-white/5 px-[1em] font-semibold">
          <SlidersHorizontal className="size-[1.1em]" /> Filters
        </span>
      </div>
      <div className="mt-[0.9em] space-y-[0.6em] px-[1.1em] pb-[4.5em]">
        {items.map(({ name, Icon, bg, pack, n, packBg }) => (
          <div
            key={name}
            className="flex items-center gap-[0.7em] rounded-[1.1em] border border-white/10 bg-white/5 p-[0.8em]"
          >
            <span
              className={cn(
                "grid size-[2.8em] shrink-0 place-items-center rounded-full text-[#10301f]",
                bg
              )}
            >
              <Icon className="size-[1.3em]" />
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-[0.9em] font-semibold">{name}</p>
              <p className="mt-[0.4em] flex items-center gap-[0.5em] text-[0.8em] font-semibold">
                <span
                  className={cn(
                    "rounded-[0.35em] px-[0.5em] py-[0.15em]",
                    packBg
                  )}
                >
                  {pack}
                </span>
                ₹100
              </p>
            </div>
            <div className="flex flex-col items-end gap-[0.5em]">
              <span className="flex items-center gap-[0.7em] rounded-full bg-white/8 px-[0.6em] py-[0.35em] text-[0.9em] font-bold tabular-nums">
                <Minus className="size-[0.9em]" /> {n}{" "}
                <Plus className="size-[0.9em]" />
              </span>
              <Trash2 className="size-[1em] text-white/50" />
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-[1em] flex justify-center gap-[0.6em]">
        <span className="flex items-center gap-[0.4em] rounded-full bg-[#f2f2e8] px-[1.4em] py-[0.9em] text-[0.95em] font-semibold text-[#10301f]">
          <Plus className="size-[1.1em]" /> Add item
        </span>
        <span className="grid size-[3em] place-items-center rounded-full bg-[#f25c2a] text-white">
          <Camera className="size-[1.2em]" />
        </span>
      </div>
    </div>
  )
}

/** The bill, as it prints: items with their counts, the total, and a NOT PAID stamp. */
export function ReceiptMock({ className }: { className?: string }) {
  const mask =
    "conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) 50% / 0.9em 100%"
  return (
    <div
      className={cn(
        "relative bg-[#fbf8ee] px-[1.3em] pt-[1.1em] pb-[2.2em] text-left text-[#1d2a22] shadow-[0_24px_50px_-12px_rgb(0_0_0/0.6)]",
        className
      )}
      style={{ WebkitMaskImage: mask, maskImage: mask }}
      aria-hidden="true"
    >
      <p className="text-center font-hand text-[2em] leading-none">
        Santa House
      </p>
      <p className="mt-[0.3em] text-center font-mono text-[0.7em] opacity-60">
        bill #882C · Today · 8:04 pm
      </p>
      <div className="mt-[0.9em] space-y-[0.8em] border-t border-dotted border-[#1d2a22]/30 pt-[0.9em] text-[0.85em]">
        {[
          ["India Gate Basmati rice (raw) 1kg", 6, "₹600"],
          ["Karachi Bakery Osmania Biscuit 400g", 4, "₹400"],
        ].map(([name, n, price]) => (
          <div key={name as string} className="flex items-center gap-[0.6em]">
            <p className="min-w-0 flex-1 leading-tight font-semibold">
              {name as string}
            </p>
            <span className="flex items-center gap-[0.5em] rounded-full bg-[#1d2a22]/10 px-[0.5em] py-[0.2em] font-mono text-[0.9em]">
              <Minus className="size-[0.8em]" /> {n as number}{" "}
              <Plus className="size-[0.8em]" />
            </span>
            <span className="w-[3em] text-right font-mono font-bold">
              {price as string}
            </span>
          </div>
        ))}
      </div>
      <div className="relative mt-[0.9em] border-t border-dashed border-[#1d2a22]/40 pt-[0.7em]">
        <span className="font-display absolute -top-[2.6em] left-[0.5em] -rotate-[8deg] rounded-[0.3em] border-[0.2em] border-[#d8431f]/85 px-[0.5em] py-[0.05em] text-[1.9em] font-black tracking-wide text-[#d8431f]/85">
          NOT PAID
        </span>
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[0.9em] font-bold">total</span>
          <span className="font-mono text-[2em] font-bold tabular-nums">
            ₹1,000
          </span>
        </div>
        <p className="mt-[0.4em] text-center font-mono text-[0.7em] opacity-55">
          in Khata
        </p>
      </div>
    </div>
  )
}
