"use client"

import * as React from "react"
import { Minus, Plus } from "lucide-react"

import { useHomeStore } from "@/store/home-store"
import type { StockItem } from "@/lib/types"

/** The - / number / + on a stock card. You can also type the number. */
export function Stepper({ item }: { item: StockItem }) {
  const adjust = useHomeStore((s) => s.adjust)
  const setQty = useHomeStore((s) => s.setQty)
  const busy = useHomeStore((s) => !!s.deletingId)
  // what is typed right now ("" while the box is empty); null = show the real count
  const [typed, setTyped] = React.useState<string | null>(null)

  const button =
    "grid size-7 shrink-0 place-items-center rounded-full transition-transform active:scale-90 active:bg-foreground/15 disabled:opacity-30"
  return (
    <div className="flex shrink-0 items-center rounded-full bg-foreground/[0.07]">
      <button
        type="button"
        aria-label={`One less ${item.name}`}
        disabled={item.qty === 0 || busy}
        onClick={() => {
          setTyped(null)
          adjust(item.id, -1)
        }}
        className={button}
      >
        <Minus className="size-3.5" />
      </button>
      <input
        inputMode="numeric"
        aria-label={`How many ${item.name}`}
        disabled={busy}
        value={typed ?? String(item.qty)}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").slice(0, 5)
          setTyped(digits)
          if (digits !== "") setQty(item.id, Number(digits)) // saved as you type
        }}
        onBlur={() => {
          if (typed === "") setQty(item.id, 0) // left empty means none
          setTyped(null)
        }}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className="h-7 w-10 min-w-0 bg-transparent text-center text-[15px] leading-none font-extrabold tabular-nums outline-none focus:rounded-md focus:bg-background/70"
      />
      <button
        type="button"
        aria-label={`One more ${item.name}`}
        disabled={busy}
        onClick={() => {
          setTyped(null)
          adjust(item.id, 1)
        }}
        className={button}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}
