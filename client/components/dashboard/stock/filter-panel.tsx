"use client"

import * as React from "react"

import { Segmented } from "@/components/dashboard/list-kit"
import { CATS } from "@/components/dashboard/stock/kit"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { CatId } from "@/lib/types"

export type Status = "all" | "low" | "out"
export type Sort = "low" | "new" | "az" | "most"

const SORTS: { id: Sort; name: string }[] = [
  { id: "low", name: "Low first" },
  { id: "new", name: "Newest" },
  { id: "az", name: "A to Z" },
  { id: "most", name: "Most" },
]

export type FilterProps = {
  cats: CatId[]
  setCats: (c: CatId[]) => void
  counts: Partial<Record<CatId, number>>
  status: Status
  setStatus: (s: Status) => void
  sort: Sort
  setSort: (s: Sort) => void
  lowCount: number
}

export function FilterPanel({
  cats,
  setCats,
  counts,
  status,
  setStatus,
  sort,
  setSort,
  lowCount,
}: FilterProps) {
  const h = "mb-1.5 text-xs font-bold"
  return (
    <div className="grid gap-3">
      <section>
        <h3 className={h}>
          Category{" "}
          <span className="font-normal text-muted-foreground">
            · pick one or more
          </span>
        </h3>
        <ToggleGroup
          multiple
          value={cats}
          onValueChange={(v) => setCats(v as CatId[])}
          spacing={6}
          aria-label="Categories"
          className="grid w-full grid-cols-3 gap-1.5"
        >
          {CATS.map((c) => (
            <ToggleGroupItem
              key={c.id}
              value={c.id}
              disabled={!counts[c.id] && !cats.includes(c.id)}
              className="h-10 min-w-0 justify-start gap-1.5 rounded-xl! border border-foreground/15 bg-card px-1.5 disabled:opacity-35 aria-pressed:border-foreground/70 aria-pressed:bg-(--tone) aria-pressed:text-[#10301f]"
              style={{ "--tone": c.tone } as React.CSSProperties}
            >
              <span
                className="grid size-6 shrink-0 place-items-center rounded-lg text-[#10301f]"
                style={{ background: c.tone }}
              >
                <c.icon className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1 truncate text-left text-xs leading-tight font-semibold">
                {c.name}
              </span>
              <span className="shrink-0 text-[10px] leading-none font-medium tabular-nums opacity-60">
                {counts[c.id] ?? 0}
              </span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </section>
      <section>
        <h3 className={h}>Stock level</h3>
        <Segmented
          compact
          value={status}
          onChange={setStatus}
          label="Stock level"
          options={[
            { id: "all", name: "All" },
            { id: "low", name: `Running low · ${lowCount}` },
            { id: "out", name: "Out" },
          ]}
        />
      </section>
      <section>
        <h3 className={h}>Sort by</h3>
        <Segmented
          compact
          value={sort}
          onChange={setSort}
          label="Sort"
          options={SORTS}
        />
      </section>
    </div>
  )
}
