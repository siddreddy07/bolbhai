"use client"

import * as React from "react"
import { Loader2, Trash2, X } from "lucide-react"

import { Stepper } from "@/components/dashboard/stock/stepper"
import { CAT, CatChip, inr, isLow } from "@/components/dashboard/stock/kit"
import { useHomeStore } from "@/store/home-store"
import type { StockItem } from "@/lib/types"
import { cn } from "@/lib/utils"

/** One item on the stock page: tap it to edit, use the counter to change the count, the bin to remove it. */
export function StockTile({
  item,
  onEdit,
}: {
  item: StockItem
  onEdit: () => void
}) {
  const removeItem = useHomeStore((s) => s.removeItem)
  const deleting = useHomeStore((s) => s.deletingId === item.id) // the server is deleting this one
  const busy = useHomeStore((s) => !!s.deletingId) // some item is being deleted: nothing else works
  const [sure, setSure] = React.useState(false) // first tap on the bin asks "Remove?", the second removes
  const out = item.qty === 0
  const low = isLow(item)

  // if nobody answers "Remove?", it goes away by itself
  React.useEffect(() => {
    if (!sure) return
    const t = window.setTimeout(() => setSure(false), 3000)
    return () => window.clearTimeout(t)
  }, [sure])

  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border border-foreground/10 bg-card p-2.5",
        deleting && "opacity-70"
      )}
    >
      <button
        type="button"
        onClick={onEdit}
        disabled={busy}
        aria-label={`Edit ${item.name}`}
        className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
      >
        {deleting ? (
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-signal/15 text-signal">
            <Loader2 className="size-[18px] animate-spin" />
          </span>
        ) : (
          <CatChip
            category={item.category}
            className={cn(
              "size-9 shrink-0 rounded-lg [&_svg]:size-[18px]",
              out && "opacity-40 grayscale"
            )}
          />
        )}
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 block text-[13px] leading-tight font-semibold break-words">
            {item.name}
          </span>
          {deleting ? (
            <span className="mt-1.5 block text-xs leading-none font-bold text-signal">
              Deleting…
            </span>
          ) : (
            <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-none">
              {item.size && (
                <span
                  className="rounded px-1.5 py-[3px] font-extrabold text-[#10301f]"
                  style={{ background: CAT[item.category].tone }}
                >
                  {item.size}
                </span>
              )}
              <span className="font-bold tabular-nums">{inr(item.price)}</span>
              {(out || low) && (
                <span className="font-bold text-red-500">
                  {out ? "Out" : "Out soon"}
                </span>
              )}
            </span>
          )}
        </span>
      </button>

      <div className="flex shrink-0 flex-col items-end justify-between gap-1.5">
        <Stepper item={item} />
        {sure ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setSure(false)
                void removeItem(item.id)
              }}
              className="flex h-7 items-center gap-1 rounded-full bg-signal px-2.5 text-xs font-bold text-white active:scale-95"
            >
              <Trash2 className="size-3.5" /> Remove?
            </button>
            <button
              type="button"
              aria-label="Keep it"
              onClick={() => setSure(false)}
              className="grid size-7 place-items-center rounded-full hover:bg-foreground/10"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            aria-label={`Remove ${item.name}`}
            disabled={busy}
            onClick={() => setSure(true)}
            className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-signal/10 hover:text-signal active:scale-90 disabled:opacity-40"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}
