"use client"

import { TILES, inr } from "@/components/dashboard/home-parts/data"
import { daysAgo } from "@/lib/bill"
import { useHomeStore, useKhata } from "@/store/home-store"
import { cn } from "@/lib/utils"

/** The three sticky notes: tap one and a small sheet slides up. */
export function Tiles() {
  const invoices = useHomeStore((s) => s.invoices)
  const stock = useHomeStore((s) => s.stock)
  const setSheet = useHomeStore((s) => s.setSheet)
  const owed = useKhata().bills.reduce(
    (n, b) => (daysAgo(b.date) === 0 ? n + b.total : n),
    0
  ) // today's unpaid only
  return (
    <nav
      aria-label="Quick look"
      className="relative mt-3 -mx-2 grid grid-cols-3 gap-2 sm:mx-0 sm:mt-6 sm:gap-4 [@media(max-height:760px)]:mt-2 md:[@media(min-height:900px)]:mt-10 md:[@media(min-height:900px)]:gap-6"
    >
      {TILES.map((t) => (
        <button
          key={t.key}
          data-tile
          type="button"
          onClick={() => setSheet(t.key)}
          className={cn(
            "relative flex min-h-[5.25rem] flex-col items-start justify-between rounded-[0.9rem] p-3 text-left text-[#10301f] shadow-[0_10px_24px_-14px_rgb(0_0_0/0.55)] transition-[translate,rotate,scale] duration-300 hover:-translate-y-0.5 hover:rotate-0 active:scale-[.94] sm:min-h-24 [@media(max-height:760px)]:min-h-[4.25rem] md:[@media(min-height:900px)]:min-h-40 md:[@media(min-height:900px)]:p-5",
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
                  : `${stock.filter((i) => i.qty === 0).length} out · ${stock.filter((i) => i.qty > 0 && i.qty < 5).length} soon`}
            </span>
          </span>
        </button>
      ))}
    </nav>
  )
}
