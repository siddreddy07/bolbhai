"use client"

import * as React from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { motion } from "motion/react"
import { Camera, Minus, Plus, SlidersHorizontal, Trash2, X } from "lucide-react"

import {
  ListScreen,
  SearchBox,
  Segmented,
  Sentinel,
  useBatches,
} from "@/components/dashboard/list-kit"
import { CatalogPicker } from "@/components/dashboard/stock/catalog-picker"
import {
  ItemEditor,
  blank,
  fromItem,
  type Draft,
} from "@/components/dashboard/stock/item-editor"
import {
  CAT,
  CATS,
  CatChip,
  inr,
  isLow,
} from "@/components/dashboard/stock/kit"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
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
      gsap.fromTo(
        num.current,
        { y: up ? 8 : -8, autoAlpha: 0.2 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.25,
          ease: "power3.out",
          overwrite: true,
        }
      )
    },
    { dependencies: [item.qty] }
  )

  const b =
    "grid size-7 shrink-0 place-items-center rounded-full transition-transform active:scale-90 active:bg-foreground/15 disabled:opacity-30"
  return (
    <div
      data-nohold
      className="flex shrink-0 items-center rounded-full bg-foreground/[0.07]"
    >
      <button
        type="button"
        aria-label={`One less ${item.name}`}
        disabled={item.qty === 0}
        onClick={() => adjust(item.id, -1)}
        className={b}
      >
        <Minus className="size-3.5" />
      </button>
      <span
        ref={num}
        className="min-w-8 text-center text-[15px] leading-none font-extrabold tabular-nums"
      >
        {item.qty}
      </span>
      <button
        type="button"
        aria-label={`One more ${item.name}`}
        onClick={() => adjust(item.id, 1)}
        className={b}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}

const HOLD_DELAY = 1 // a press shorter than this shows nothing (it is just a press)
const HOLD_SECONDS = 1.2 // how long to hold a card (phone, tablet) before it is deleted
const RING = 2 * Math.PI * 21 // the length of the loading ring around the icon

function Tile({ item, onEdit }: { item: StockItem; onEdit: () => void }) {
  const removeItem = useHomeStore((s) => s.removeItem)
  const [sure, setSure] = React.useState(false) // desktop: first tap asks "Remove?", second tap removes
  const [holding, setHolding] = React.useState(false) // phone, tablet: the ring is filling
  const askRef = React.useRef<HTMLDivElement>(null)
  const holdTimer = React.useRef<number[]>([]) // the two timers: show the ring, then delete
  const justDeleted = React.useRef(false) // stops the tap that ends the hold from also opening the editor
  const low = isLow(item)
  const out = item.qty === 0
  const tone = CAT[item.category].tone

  React.useEffect(() => {
    if (!sure) return
    const t = window.setTimeout(() => setSure(false), 3000)
    return () => window.clearTimeout(t)
  }, [sure])

  // the question slides in where the counter was
  useGSAP(
    () => {
      if (
        !sure ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        return
      gsap.from(askRef.current, {
        x: 14,
        autoAlpha: 0,
        duration: 0.22,
        ease: "power3.out",
      })
    },
    { dependencies: [sure] }
  )

  const stop = () => {
    holdTimer.current.forEach(window.clearTimeout)
    holdTimer.current = []
    setHolding(false)
  }

  // the card goes away while a timer is still running: never fire it
  React.useEffect(
    () => () => holdTimer.current.forEach(window.clearTimeout),
    []
  )

  return (
    <motion.div
      data-card
      data-id={item.id}
      // Phone and tablet: hold the card anywhere except the counter. The ring on the icon fills, then it is deleted.
      onTapStart={(event) => {
        const small = !window.matchMedia("(min-width: 1024px)").matches
        if (!small || (event.target as HTMLElement).closest("[data-nohold]"))
          return
        // 1) after HOLD_DELAY of holding, the ring starts and the text says "release to cancel"
        // 2) HOLD_SECONDS later, when the ring is full, the product is deleted
        const show = window.setTimeout(
          () => setHolding(true),
          HOLD_DELAY * 1000
        )
        const remove = window.setTimeout(
          () => {
            justDeleted.current = true
            setHolding(false)
            removeItem(item.id)
          },
          (HOLD_DELAY + HOLD_SECONDS) * 1000
        )
        holdTimer.current = [show, remove]
      }}
      onTap={stop} // let go early = cancelled
      onTapCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      className="relative flex gap-3 rounded-xl border border-foreground/10 bg-card p-2.5 select-none [-webkit-touch-callout:none]"
    >
      <button
        type="button"
        onClick={() => {
          if (justDeleted.current) return
          onEdit()
        }}
        aria-label={`Edit ${item.name}`}
        className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
      >
        <span className="relative shrink-0">
          {holding ? (
            <span className="grid size-9 place-items-center rounded-lg bg-signal/15 text-signal">
              <Trash2 className="size-[18px]" />
            </span>
          ) : (
            <CatChip
              category={item.category}
              className={cn(
                "size-9 rounded-lg [&_svg]:size-[18px]",
                out && "opacity-40 grayscale"
              )}
            />
          )}
          <svg
            aria-hidden="true"
            viewBox="0 0 48 48"
            className="pointer-events-none absolute -inset-1.5 size-12 -rotate-90"
          >
            <circle
              cx="24"
              cy="24"
              r="21"
              fill="none"
              strokeWidth="3.5"
              className="stroke-signal/20"
              style={{ opacity: holding ? 1 : 0 }}
            />
            <circle
              cx="24"
              cy="24"
              r="21"
              fill="none"
              strokeWidth="3.5"
              strokeLinecap="round"
              className="stroke-signal"
              strokeDasharray={RING}
              style={{
                strokeDashoffset: holding ? 0 : RING,
                opacity: holding ? 1 : 0,
                transition: holding
                  ? `stroke-dashoffset ${HOLD_SECONDS}s linear`
                  : "opacity 0.15s",
              }}
            />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 block text-[13px] leading-tight font-semibold break-words">
            {item.name}
          </span>
          {holding ? (
            <span className="mt-1.5 block text-xs leading-none font-bold text-signal">
              Release to cancel delete
            </span>
          ) : (
            <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-none">
              {item.size && (
                <span
                  className="rounded px-1.5 py-[3px] font-extrabold text-[#10301f]"
                  style={{ background: tone }}
                >
                  {item.size}
                </span>
              )}
              <span className="font-bold tabular-nums">{inr(item.price)}</span>
              {(out || low) && (
                <span className="font-bold text-signal">
                  {out ? "Out" : "Low"}
                </span>
              )}
            </span>
          )}
        </span>
      </button>

      {/* right column: the counter on top, and (desktop only) delete at the bottom */}
      <div className="flex shrink-0 flex-col items-end justify-center gap-1.5 lg:justify-between">
        <Stepper item={item} />
        {sure ? (
          <div data-nohold ref={askRef} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => removeItem(item.id)}
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
            data-nohold
            type="button"
            aria-label={`Remove ${item.name}`}
            onClick={() => setSure(true)}
            className="hidden size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-signal/10 hover:text-signal active:scale-90 lg:grid"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </motion.div>
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

function FilterPanel({
  cats,
  setCats,
  counts,
  status,
  setStatus,
  sort,
  setSort,
  lowCount,
}: FilterProps) {
  return (
    <div className="grid gap-5">
      <section>
        <h3 className="mb-2 text-sm font-bold">
          Category{" "}
          <span className="font-normal text-muted-foreground">
            · pick one or more
          </span>
        </h3>
        <ToggleGroup
          multiple
          value={cats}
          onValueChange={(v) => setCats(v as CatId[])}
          spacing={8}
          aria-label="Categories"
          className="mx-auto grid w-full max-w-md grid-cols-3 gap-2"
        >
          {CATS.map((c) => (
            <ToggleGroupItem
              key={c.id}
              value={c.id}
              disabled={!counts[c.id] && !cats.includes(c.id)}
              className="h-auto flex-col gap-1 rounded-2xl! border border-foreground/15 bg-card px-1.5 py-2.5 disabled:opacity-35 aria-pressed:border-foreground/70 aria-pressed:bg-(--tone) aria-pressed:text-[#10301f]"
              style={{ "--tone": c.tone } as React.CSSProperties}
            >
              <span
                className="grid size-9 place-items-center rounded-xl text-[#10301f]"
                style={{ background: c.tone }}
              >
                <c.icon className="size-[18px]" />
              </span>
              <span className="text-[13px] leading-tight font-semibold">
                {c.name}
              </span>
              <span className="text-[11px] leading-none font-medium opacity-60">
                {counts[c.id] ?? 0}
              </span>
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
          <Segmented
            value={sort}
            onChange={setSort}
            label="Sort"
            options={SORTS}
          />
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
  const stockShopId = useHomeStore((s) => s.stockShopId)
  const loadStock = useHomeStore((s) => s.loadStock)

  const [q, setQ] = React.useState("")
  const [cats, setCats] = React.useState<CatId[]>([])
  const [status, setStatus] = React.useState<Status>("all")
  const [sort, setSort] = React.useState<Sort>("low")
  const [filterOpen, setFilterOpen] = React.useState(false)
  const [draft, setDraft] = React.useState<Draft | null>(null)
  const [flash, setFlash] = React.useState<string | null>(null)
  const [soon, setSoon] = React.useState(false)
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const scroller = React.useRef<HTMLDivElement>(null)
  const root = React.useRef<HTMLDivElement>(null)

  const needle = q.trim().toLowerCase()
  // counts follow search and stock level, so a chip never promises items that are hidden
  const base = React.useMemo(
    () =>
      stock.filter(
        (i) =>
          (!needle || i.name.toLowerCase().includes(needle)) &&
          (status === "all" || (status === "out" ? i.qty === 0 : isLow(i)))
      ),
    [stock, needle, status]
  )
  const counts = React.useMemo(() => {
    const m: Partial<Record<CatId, number>> = {}
    base.forEach((i) => (m[i.category] = (m[i.category] ?? 0) + 1))
    return m
  }, [base])

  const list = React.useMemo(() => {
    const l = cats.length
      ? base.filter((i) => cats.includes(i.category))
      : [...base]
    if (sort === "az") l.sort((a, b) => a.name.localeCompare(b.name))
    else if (sort === "most") l.sort((a, b) => b.qty - a.qty)
    else if (sort === "new") l.sort((a, b) => b.added - a.added)
    else l.sort((a, b) => a.qty / a.max - b.qty / b.max)
    return l
  }, [base, cats, sort])

  const activeCount =
    cats.length + (status !== "all" ? 1 : 0) + (sort !== "low" ? 1 : 0)
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
  const [frozen, setFrozen] = React.useState({
    k: freezeKey,
    ids: list.map((i) => i.id),
  })
  if (frozen.k !== freezeKey)
    setFrozen({ k: freezeKey, ids: list.map((i) => i.id) })
  const byId = React.useMemo(
    () => new Map(stock.map((i) => [i.id, i])),
    [stock]
  )
  const held = React.useMemo(
    () =>
      frozen.ids.map((id) => byId.get(id)).filter((i): i is StockItem => !!i),
    [frozen.ids, byId]
  )
  const { shown, more, sentinel } = useBatches(held, key, 30)
  const lowCount = stock.filter(isLow).length
  const fp: FilterProps = {
    cats,
    setCats,
    counts,
    status,
    setStatus,
    sort,
    setSort,
    lowCount,
  }

  // rows rise in whenever the filters change
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      gsap.fromTo(
        "[data-card]",
        { y: 14, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.4,
          stagger: { each: 0.02, amount: 0.3 },
          ease: "power3.out",
          overwrite: true,
        }
      )
    },
    { dependencies: [key], scope: root }
  )

  // a saved item gets a little highlight
  useGSAP(
    () => {
      if (!flash) return
      const el = root.current?.querySelector<HTMLElement>(
        `[data-id="${flash}"]`
      )
      if (!el) return
      el.scrollIntoView({ block: "nearest", behavior: "smooth" })
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      gsap.fromTo(
        el,
        { backgroundColor: "rgba(76,214,129,0.35)" },
        {
          backgroundColor: "rgba(76,214,129,0)",
          duration: 1.4,
          ease: "power2.out",
        }
      )
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
                <SearchBox
                  value={q}
                  onChange={setQ}
                  placeholder="Search an item"
                />
              </div>
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                className="flex h-11 shrink-0 items-center gap-2 rounded-full border border-foreground/15 bg-card px-4 text-sm font-semibold transition-transform active:scale-95"
              >
                <SlidersHorizontal className="size-[18px]" /> Filters
                {activeCount > 0 && (
                  <span className="grid size-5 place-items-center rounded-full bg-signal text-[11px] font-extrabold text-white">
                    {activeCount}
                  </span>
                )}
              </button>
            </div>
            {activeCount > 0 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Showing {held.length} {held.length === 1 ? "item" : "items"}
                </span>
                <button
                  onClick={clear}
                  className="flex items-center gap-1 font-semibold text-foreground underline underline-offset-4"
                >
                  <X className="size-3.5" /> Clear filters
                </button>
              </div>
            )}
          </>
        }
      >
        <div
          ref={scroller}
          className="mt-1 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 pb-28"
        >
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,19rem),1fr))] gap-1.5">
            {shown.map((i) => (
              <Tile key={i.id} item={i} onEdit={() => setDraft(fromItem(i))} />
            ))}
          </div>
          <Sentinel
            more={more}
            innerRef={sentinel}
            left={held.length - shown.length}
          />
          {held.length === 0 && (
            <div className="grid place-items-center py-16 text-center">
              <p className="font-hand text-3xl">Nothing here.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try fewer filters, or add the item yourself.
              </p>
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {soon && (
            <p
              role="status"
              className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-lg"
            >
              Photo add is coming soon.
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
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
              <DrawerTitle className="font-hand text-4xl leading-none font-semibold">
                Filters
              </DrawerTitle>
              <DrawerDescription>Pick what you want to see.</DrawerDescription>
            </DrawerHeader>
            <FilterPanel {...fp} />
            <div className="mt-6 grid grid-cols-[auto_1fr] gap-2">
              <Button
                variant="ghost"
                onClick={clear}
                disabled={activeCount === 0}
                className="h-12 rounded-full px-5 text-base"
              >
                Clear
              </Button>
              <Button
                onClick={() => setFilterOpen(false)}
                className="h-12 rounded-full text-base"
              >
                Show {list.length} {list.length === 1 ? "item" : "items"}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <CatalogPicker
        open={pickerOpen}
        shopId={stockShopId}
        onClose={() => setPickerOpen(false)}
        onAdded={() => {
          setSort("new")
          setQ("")
          setStatus("all")
          setCats([])
          if (stockShopId) void loadStock(stockShopId, true) // the new products show up in the list
        }}
        onManual={() => setDraft(blank(cats[0] ?? "cereals"))}
      />

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
