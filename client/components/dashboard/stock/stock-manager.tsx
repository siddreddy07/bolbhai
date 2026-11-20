"use client"

import * as React from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { Camera, Minus, Plus, SlidersHorizontal, X } from "lucide-react"

import { ListScreen, SearchBox, Segmented, Sentinel, useBatches } from "@/components/dashboard/list-kit"
import { ItemEditor, blank, fromItem, type Draft } from "@/components/dashboard/stock/item-editor"
import { CATS, CatChip, inr, isLow } from "@/components/dashboard/stock/kit"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useHomeStore } from "@/lib/home-store"
import type { CatId, StockItem } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

type Status = "all" | "low" | "out"
type Sort = "low" | "new" | "az" | "most"

const SORTS: { id: Sort; name: string }[] = [
  { id: "low", name: "Low first" },
  { id: "new", name: "Newest" },
  { id: "az", name: "A to Z" },
  { id: "most", name: "Most" },
]

/* ---------------- one item: name, level, and - / + to count ---------------- */

function Stepper({ item }: { item: StockItem }) {
  const adjust = useHomeStore((s) => s.adjust)
  const num = React.useRef<HTMLSpanElement>(null)
  const prev = React.useRef(item.qty)

  useGSAP(
    () => {
      if (prev.current === item.qty) return
      const up = item.qty > prev.current
      prev.current = item.qty
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      gsap.fromTo(num.current, { y: up ? 10 : -10, autoAlpha: 0.2 }, { y: 0, autoAlpha: 1, duration: 0.28, ease: "power3.out", overwrite: true })
    },
    { dependencies: [item.qty] }
  )

  const b = "grid size-9 shrink-0 place-items-center rounded-full text-foreground transition-transform active:scale-90 active:bg-foreground/15 disabled:opacity-30"
  return (
    <div className="flex shrink-0 items-center rounded-full bg-foreground/[0.07] p-0.5">
      <button type="button" aria-label={`One less ${item.name}`} disabled={item.qty === 0} onClick={() => adjust(item.id, -1)} className={b}>
        <Minus className="size-4" />
      </button>
      <span ref={num} className="min-w-9 text-center text-lg leading-none font-extrabold tabular-nums">
        {item.qty}
      </span>
      <button type="button" aria-label={`One more ${item.name}`} onClick={() => adjust(item.id, 1)} className={b}>
        <Plus className="size-4" />
      </button>
    </div>
  )
}

function Tile({ item, onEdit }: { item: StockItem; onEdit: () => void }) {
  const low = isLow(item)
  const out = item.qty === 0
  return (
    <div data-card data-id={item.id} className="flex items-center gap-2 rounded-2xl border border-foreground/10 bg-card py-2 pr-2 pl-2.5">
      <button type="button" onClick={onEdit} aria-label={`Edit ${item.name}`} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
        <CatChip category={item.category} className={cn("size-10 rounded-lg", out && "opacity-40 grayscale")} />
        <span className="min-w-0">
          <span className="line-clamp-2 block text-sm leading-tight font-semibold">{item.name}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            {(out || low) && (
              <span className="rounded-full bg-signal/15 px-1.5 py-px text-[11px] font-bold text-signal">{out ? "Out" : "Low"}</span>
            )}
            <span className="truncate">
              {inr(item.price)} · {item.unit}
            </span>
          </span>
        </span>
      </button>
      <Stepper item={item} />
    </div>
  )
}

/* ---- the filters: one panel, in a bottom drawer (phone, tablet) or inline (desktop) ---- */

type FilterProps = {
  cats: CatId[]
  setCats: (c: CatId[]) => void
  counts: Partial<Record<CatId, number>>
  status: Status
  setStatus: (s: Status) => void
  sort: Sort
  setSort: (s: Sort) => void
  lowCount: number
}

function FilterPanel({ cats, setCats, counts, status, setStatus, sort, setSort, lowCount }: FilterProps) {
  return (
    <div className="grid gap-5">
      <section>
        <h3 className="mb-2 text-sm font-bold">
          Category <span className="font-normal text-muted-foreground">· pick one or more</span>
        </h3>
        <ToggleGroup multiple value={cats} onValueChange={(v) => setCats(v as CatId[])} spacing={8} aria-label="Categories" className="mx-auto grid w-full max-w-md grid-cols-3 gap-2">
          {CATS.map((c) => (
            <ToggleGroupItem
              key={c.id}
              value={c.id}
              disabled={!counts[c.id] && !cats.includes(c.id)}
              className="h-auto flex-col gap-1 rounded-2xl! border border-foreground/15 bg-card px-1.5 py-2.5 aria-pressed:border-foreground/70 aria-pressed:bg-(--tone) aria-pressed:text-[#10301f] disabled:opacity-35"
              style={{ "--tone": c.tone } as React.CSSProperties}
            >
              <span className="grid size-9 place-items-center rounded-xl text-[#10301f]" style={{ background: c.tone }}>
                <c.icon className="size-[18px]" />
              </span>
              <span className="text-[13px] leading-tight font-semibold">{c.name}</span>
              <span className="text-[11px] leading-none font-medium opacity-60">{counts[c.id] ?? 0}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </section>
      <div className="grid gap-5">
        <section>
          <h3 className="mb-2 text-sm font-bold">Stock level</h3>
          <Segmented
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
          <h3 className="mb-2 text-sm font-bold">Sort by</h3>
          <Segmented value={sort} onChange={setSort} label="Sort" options={SORTS} />
        </section>
      </div>
    </div>
  )
}

/* ---------------------------------- the page ---------------------------------- */

export function StockManager() {
  const stock = useHomeStore((s) => s.stock)
  const saveItem = useHomeStore((s) => s.saveItem)
  const removeItem = useHomeStore((s) => s.removeItem)

  const [q, setQ] = React.useState("")
  const [cats, setCats] = React.useState<CatId[]>([])
  const [status, setStatus] = React.useState<Status>("all")
  const [sort, setSort] = React.useState<Sort>("low")
  const [filterOpen, setFilterOpen] = React.useState(false)
  const [draft, setDraft] = React.useState<Draft | null>(null)
  const [flash, setFlash] = React.useState<string | null>(null)
  const [soon, setSoon] = React.useState(false)
  const scroller = React.useRef<HTMLDivElement>(null)
  const root = React.useRef<HTMLDivElement>(null)

  const needle = q.trim().toLowerCase()
  // counts follow search and stock level, so a chip never promises items that are hidden
  const base = React.useMemo(
    () => stock.filter((i) => (!needle || i.name.toLowerCase().includes(needle)) && (status === "all" || (status === "out" ? i.qty === 0 : isLow(i)))),
    [stock, needle, status]
  )
  const counts = React.useMemo(() => {
    const m: Partial<Record<CatId, number>> = {}
    base.forEach((i) => (m[i.category] = (m[i.category] ?? 0) + 1))
    return m
  }, [base])

  const list = React.useMemo(() => {
    const l = cats.length ? base.filter((i) => cats.includes(i.category)) : [...base]
    if (sort === "az") l.sort((a, b) => a.name.localeCompare(b.name))
    else if (sort === "most") l.sort((a, b) => b.qty - a.qty)
    else if (sort === "new") l.sort((a, b) => b.added - a.added)
    else l.sort((a, b) => a.qty / a.max - b.qty / b.max)
    return l
  }, [base, cats, sort])

  const activeCount = cats.length + (status !== "all" ? 1 : 0) + (sort !== "low" ? 1 : 0)
  const clear = () => {
    setCats([])
    setStatus("all")
    setSort("low")
    setQ("")
  }
  const key = `${needle}|${cats.join(",")}|${status}|${sort}`
  // The order is worked out when the search, filters or sort change (or an item is added
  // or removed), and then held. Changing a count never re-sorts or hides a row, so the
  // thing you just tapped stays right under your thumb.
  const freezeKey = `${key}|${stock.length}`
  const [frozen, setFrozen] = React.useState({ k: freezeKey, ids: list.map((i) => i.id) })
  if (frozen.k !== freezeKey) setFrozen({ k: freezeKey, ids: list.map((i) => i.id) })
  const byId = React.useMemo(() => new Map(stock.map((i) => [i.id, i])), [stock])
  const held = React.useMemo(() => frozen.ids.map((id) => byId.get(id)).filter((i): i is StockItem => !!i), [frozen.ids, byId])
  const { shown, more, sentinel } = useBatches(held, key, 30)
  const lowCount = stock.filter(isLow).length
  const fp: FilterProps = { cats, setCats, counts, status, setStatus, sort, setSort, lowCount }

  // rows rise in whenever the filters change
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      gsap.fromTo("[data-card]", { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4, stagger: { each: 0.02, amount: 0.3 }, ease: "power3.out", overwrite: true })
    },
    { dependencies: [key], scope: root }
  )

  // a saved item gets a little highlight
  useGSAP(
    () => {
      if (!flash) return
      const el = root.current?.querySelector<HTMLElement>(`[data-id="${flash}"]`)
      if (!el) return
      el.scrollIntoView({ block: "nearest", behavior: "smooth" })
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      gsap.fromTo(el, { backgroundColor: "rgba(76,214,129,0.35)" }, { backgroundColor: "rgba(76,214,129,0)", duration: 1.4, ease: "power2.out" })
    },
    { dependencies: [flash, shown.length], scope: root }
  )

  const onSave = (d: Draft) => {
    const id = saveItem({
      id: d.id,
      name: d.name.trim(),
      category: d.category,
      unit: d.unit,
      qty: Number(d.qty) || 0,
      max: Math.max(1, Number(d.max) || 1),
      price: Number(d.price) || 0,
    })
    if (!d.id) {
      // make sure the new item is visible: newest first, nothing filtering it out
      setSort("new")
      setQ("")
      setStatus("all")
      if (cats.length && !cats.includes(d.category)) setCats([])
      scroller.current?.scrollTo({ top: 0 })
    }
    setFlash(null)
    requestAnimationFrame(() => setFlash(id))
    setDraft(null)
  }

  return (
    <div ref={root}>
      <ListScreen
        title="Stock"
        count={`${stock.length} items · ${lowCount} running low`}
        controls={
          <>
            <div className="flex gap-2">
              <div className="min-w-0 flex-1">
                <SearchBox value={q} onChange={setQ} placeholder="Search an item" />
              </div>
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                className="flex h-11 shrink-0 items-center gap-2 rounded-full border border-foreground/15 bg-card px-4 text-sm font-semibold transition-transform active:scale-95"
              >
                <SlidersHorizontal className="size-[18px]" /> Filters
                {activeCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-signal text-[11px] font-extrabold text-white">{activeCount}</span>}
              </button>
            </div>
            {activeCount > 0 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Showing {held.length} {held.length === 1 ? "item" : "items"}
                </span>
                <button onClick={clear} className="flex items-center gap-1 font-semibold text-foreground underline underline-offset-4">
                  <X className="size-3.5" /> Clear filters
                </button>
              </div>
            )}
          </>
        }
      >
        <div ref={scroller} className="mt-1 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 pb-28">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5">
            {shown.map((i) => (
              <Tile key={i.id} item={i} onEdit={() => setDraft(fromItem(i))} />
            ))}
          </div>
          <Sentinel more={more} innerRef={sentinel} left={held.length - shown.length} />
          {held.length === 0 && (
            <div className="grid place-items-center py-16 text-center">
              <p className="font-hand text-3xl">Nothing here.</p>
              <p className="mt-1 text-sm text-muted-foreground">Try fewer filters, or add the item yourself.</p>
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {soon && (
            <p role="status" className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-lg">
              Photo add is coming soon.
            </p>
          )}
          <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDraft(blank(cats[0] ?? "cereals"))}
            className="pointer-events-auto flex h-14 items-center gap-2 rounded-full bg-foreground px-7 text-base font-semibold text-background shadow-[0_16px_36px_-12px_rgb(0_0_0/0.6)] transition-transform active:scale-95"
          >
            <Plus className="size-5" /> Add item
          </button>
          <button
            type="button"
            aria-label="Add by photo (coming soon)"
            onClick={() => {
              setSoon(true)
              window.setTimeout(() => setSoon(false), 2200)
            }}
            className="pointer-events-auto grid size-14 place-items-center rounded-full bg-signal text-white shadow-[0_16px_36px_-12px_rgb(242_92_42/0.7)] transition-transform active:scale-95"
          >
            <Camera className="size-6" />
          </button>
          </div>
        </div>
      </ListScreen>

      <Drawer open={filterOpen} onOpenChange={setFilterOpen} showSwipeHandle>
        <DrawerContent className="mx-auto max-w-[560px]">
          <div className="max-h-[80dvh] overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <DrawerHeader className="p-0 pb-4 text-left">
              <DrawerTitle className="font-hand text-4xl leading-none font-semibold">Filters</DrawerTitle>
              <DrawerDescription>Pick what you want to see.</DrawerDescription>
            </DrawerHeader>
            <FilterPanel {...fp} />
            <div className="mt-6 grid grid-cols-[auto_1fr] gap-2">
              <Button variant="ghost" onClick={clear} disabled={activeCount === 0} className="h-12 rounded-full px-5 text-base">
                Clear
              </Button>
              <Button onClick={() => setFilterOpen(false)} className="h-12 rounded-full text-base">
                Show {list.length} {list.length === 1 ? "item" : "items"}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <ItemEditor
        draft={draft}
        onClose={() => setDraft(null)}
        onSave={onSave}
        onDelete={(id) => {
          removeItem(id)
          setDraft(null)
        }}
      />
    </div>
  )
}
