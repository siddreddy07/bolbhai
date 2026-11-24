"use client"

import * as React from "react"
import { Camera, Plus, SlidersHorizontal, X } from "lucide-react"

import {
  ListScreen,
  Sentinel,
  SkeletonRows,
  useBatches,
} from "@/components/dashboard/list-kit"
import {
  FilterPanel,
  type FilterProps,
  type Sort,
  type Status,
} from "@/components/dashboard/stock/filter-panel"
import { StockTile } from "@/components/dashboard/stock/stock-tile"
import { CatalogPicker } from "@/components/dashboard/stock/catalog-picker"
import {
  ItemEditor,
  blank,
  fromItem,
  type Draft,
} from "@/components/dashboard/stock/item-editor"
import { isLow } from "@/components/dashboard/stock/kit"
import { Button } from "@/components/ui/button"
import { SearchBox } from "@/components/ui/search-box"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { syncStock, useHomeStore } from "@/store/home-store"
import type { CatId, StockItem } from "@/lib/types"
import { cn } from "@/lib/utils"

/** one row of GET /api/inventory/search */
type InventoryHit = {
  id: string
  name: string
  brand: string | null
  size: string | null
  stock: number
}

/* ---------------------------------- the page ---------------------------------- */

export function StockManager() {
  const stock = useHomeStore((s) => s.stock)
  const saveItem = useHomeStore((s) => s.saveItem)
  const removeItem = useHomeStore((s) => s.removeItem)
  const busy = useHomeStore((s) => !!s.deletingId)
  const stockShopId = useHomeStore((s) => s.stockShopId)
  const loadStock = useHomeStore((s) => s.loadStock)
  const stockLoading = useHomeStore((s) => s.stockLoading)
  // nothing to show yet: the shelf has not been asked for, or is on its way
  const loading = (stockLoading || !stockShopId) && stock.length === 0

  // Leaving the stock page (or hiding the tab) sends the latest counts at once, without waiting for the timer.
  React.useEffect(() => {
    const hidden = () =>
      document.visibilityState === "hidden" && void syncStock(true)
    const closing = () => void syncStock(true)
    document.addEventListener("visibilitychange", hidden)
    window.addEventListener("pagehide", closing)
    return () => {
      document.removeEventListener("visibilitychange", hidden)
      window.removeEventListener("pagehide", closing)
      void syncStock()
    }
  }, [])

  const [q, setQ] = React.useState("")
  const [cats, setCats] = React.useState<CatId[]>([])
  const [status, setStatus] = React.useState<Status>("all")
  const [sort, setSort] = React.useState<Sort>("low")
  const [filterOpen, setFilterOpen] = React.useState(false)
  const [draft, setDraft] = React.useState<Draft | null>(null)
  const [soon, setSoon] = React.useState(false)
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [fromPicker, setFromPicker] = React.useState(false) // the new-item form came from "Add to your shop"
  const scroller = React.useRef<HTMLDivElement>(null)

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
    else l.sort((a, b) => a.qty - b.qty)
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
  const filterProps: FilterProps = {
    cats,
    setCats,
    counts,
    status,
    setStatus,
    sort,
    setSort,
    lowCount,
  }

  const onSave = (d: Draft) => {
    saveItem({
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
    setDraft(null)
  }

  return (
    <div>
      <ListScreen
        title="Stock"
        count={loading ? "Loading…" : `${stock.length} items · ${lowCount} running low`}
        controls={
          <>
            <div className="flex gap-2">
              <div className="min-w-0 flex-1">
                {/* the box asks the server (this shop's inventory); the grid below follows the typed words */}
                <SearchBox<InventoryHit>
                  url="/api/inventory/search"
                  params={{ shopId: stockShopId ?? undefined }}
                  cacheKey={stock.length}
                  value={q}
                  onValueChange={setQ}
                  getKey={(i) => i.id}
                  getLabel={(i) => i.name}
                  getHint={(i) =>
                    [i.size, `${byId.get(i.id)?.qty ?? i.stock} in stock`]
                      .filter(Boolean)
                      .join(" · ")
                  }
                  onSelect={(i) => {
                    // show just this item, and highlight it
                    setCats([])
                    setStatus("all")
                    setQ(i.name)
                    scroller.current?.scrollTo({ top: 0 })
                  }}
                  placeholder="Item from your shop"
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
          className="mt-1 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 pb-24"
        >
          <div
            className={cn(
              "grid grid-cols-[repeat(auto-fill,minmax(min(100%,19rem),1fr))] gap-1.5",
              busy && "pointer-events-none"
            )}
          >
            {loading && (
              <SkeletonRows count={6} className="h-24" />
            )}
            {shown.map((i) => (
              <StockTile
                key={i.id}
                item={i}
                onEdit={() => setDraft(fromItem(i))}
              />
            ))}
          </div>
          <Sentinel
            more={more}
            innerRef={sentinel}
            left={held.length - shown.length}
          />
          {!loading && held.length === 0 && (
            <div className="grid place-items-center py-16 text-center">
              <p className="font-hand text-3xl">Nothing here.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try fewer filters, or add the item yourself.
              </p>
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] flex flex-col items-center gap-2 px-4">
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
              disabled={busy}
              onClick={() => setPickerOpen(true)}
              className="pointer-events-auto flex h-14 items-center gap-2 rounded-full bg-foreground px-3 sm:px-7 text-[14px] sm:text-base font-semibold text-background shadow-[0_16px_36px_-12px_rgb(0_0_0/0.6)] transition-transform active:scale-95 disabled:opacity-50"
            >
              <Plus className="size-5" /> Add item to inventory
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
        <DrawerContent className="mx-auto max-w-[24rem]">
          {/* everything fits without scrolling; the scroll is only a safety net for a very short screen */}
          <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain px-3.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <DrawerHeader className="flex-row items-center justify-between p-0 pb-2.5">
              <DrawerTitle className="font-hand text-2xl leading-none font-semibold">
                Filters
              </DrawerTitle>
              <DrawerDescription className="sr-only">
                Pick what you want to see.
              </DrawerDescription>
              <button
                type="button"
                onClick={clear}
                disabled={activeCount === 0}
                className="h-8 rounded-full px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              >
                Clear
              </button>
            </DrawerHeader>
            <FilterPanel {...filterProps} />
            <Button
              onClick={() => setFilterOpen(false)}
              className="mt-3.5 h-11 w-full rounded-full text-base"
            >
              Show {list.length} {list.length === 1 ? "item" : "items"}
            </Button>
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
          if (stockShopId) void loadStock(stockShopId) // the new products show up in the list
        }}
        onManual={() => {
          setFromPicker(true)
          setDraft(blank(cats[0] ?? "cereals"))
        }}
      />

      <ItemEditor
        draft={draft}
        onClose={() => setDraft(null)}
        onBack={
          fromPicker
            ? () => {
                setDraft(null)
                setPickerOpen(true)
              }
            : undefined
        }
        onSave={onSave}
        onDelete={(id) => {
          removeItem(id)
          setDraft(null)
        }}
      />
    </div>
  )
}
