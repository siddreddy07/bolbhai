"use client"

import * as React from "react"
import { Check, Minus, Plus, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { useHomeStore } from "@/store/home-store"
import { searchKey, useInventoryStore, type CatalogProduct } from "@/store/inventory-store"

const DEBOUNCE_MS = 350
const MIN_LETTERS = 2

type Picked = { product: CatalogProduct; qty: number }

/** - 3 +  : how many the shop has right now (0 is fine, it can be raised later from the stock page). */
function Qty({ value, onChange, name }: { value: number; onChange: (n: number) => void; name: string }) {
  const b = "grid size-8 place-items-center rounded-full border border-foreground/15 bg-card active:scale-90 disabled:opacity-30"
  return (
    <span className="flex shrink-0 items-center gap-1">
      <button type="button" aria-label={`One less ${name}`} disabled={value <= 0} onClick={() => onChange(Math.max(0, value - 1))} className={b}>
        <Minus className="size-3.5" />
      </button>
      <input
        inputMode="decimal"
        aria-label={`How many ${name}`}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value.replace(/[^\d.]/g, ""))
          onChange(Number.isFinite(n) ? Math.min(n, 1_000_000) : 0)
        }}
        className="h-8 w-12 rounded-lg bg-transparent text-center text-sm font-bold outline-none focus:bg-foreground/5"
      />
      <button type="button" aria-label={`One more ${name}`} onClick={() => onChange(value + 1)} className={b}>
        <Plus className="size-3.5" />
      </button>
    </span>
  )
}

const label = (p: CatalogProduct) => `${p.brand ? p.brand + " " : ""}${p.name}`

/** Search the product catalog, pick products one by one, then add them all to the shop in one go. */
export function CatalogPicker({
  open,
  shopId,
  onClose,
  onAdded,
  onManual,
}: {
  open: boolean
  shopId: string | null
  onClose: () => void
  /** the products are on the shelf now: reload the stock */
  onAdded: () => void
  /** "it is not in the list": open the form to type it yourself */
  onManual: () => void
}) {
  const cached = useInventoryStore((s) => s.cached)
  const search = useInventoryStore((s) => s.search)
  const addProducts = useInventoryStore((s) => s.addProducts)
  const [text, setText] = React.useState("")
  // the answer remembers which search it belongs to, so an old answer never shows for new text
  const [answer, setAnswer] = React.useState<{ key: string; items: CatalogProduct[] }>({ key: "", items: [] })
  // the quantity typed in a search row, before the product is picked
  const [rowQty, setRowQty] = React.useState<Record<string, number>>({})
  const [picked, setPicked] = React.useState<Picked[]>([])
  // products this shop already has (by catalog product id), so the results can say so
  const owned = useHomeStore((s) => s.stock)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Debounce: wait until the typing pauses, then use the cache or ask the server.
  React.useEffect(() => {
    const key = searchKey(text)
    if (key.length < MIN_LETTERS) return // nothing to search: no results are shown

    let stale = false
    const timer = window.setTimeout(async () => {
      const hit = cached(key)
      if (hit) {
        console.log(`[search] "${key}": CACHE used, no API call`)
        setAnswer({ key, items: hit })
        return
      }
      console.log(`[search] "${key}": API called`)
      try {
        const found = await search(key)
        if (!stale) setAnswer({ key, items: found })
      } catch {
        if (!stale) setAnswer({ key, items: [] })
      }
    }, DEBOUNCE_MS)

    return () => {
      stale = true // a newer keystroke came: forget this one
      window.clearTimeout(timer)
    }
  }, [text, cached, search])

  const ownedIds = React.useMemo(() => new Set(owned.map((i) => i.productId).filter(Boolean)), [owned])

  const choose = (product: CatalogProduct) => {
    const qty = rowQty[product.id] ?? 0
    setPicked((now) => (now.some((p) => p.product.id === product.id) ? now : [...now, { product, qty }]))
    setText("") // clears the box and closes the results, so the next product can be typed
  }

  const finish = () => {
    setText("")
    setRowQty({})
    setPicked([])
    setError(null)
    onClose()
  }

  const addAll = async () => {
    if (!shopId || !picked.length || saving) return
    setSaving(true)
    setError(null)
    try {
      await addProducts(shopId, picked.map((p) => ({ productId: p.product.id, stock: p.qty })))
      onAdded()
      finish()
    } catch {
      setError("Could not add them. Try again.")
    } finally {
      setSaving(false)
    }
  }

  // an empty answer, or one for older text, shows nothing: the results are closed
  const results = answer.key === searchKey(text) ? answer.items : []
  const showResults = results.length > 0

  return (
    <Drawer open={open} onOpenChange={(o) => !o && finish()} showSwipeHandle>
      <DrawerContent className="mx-auto max-w-[560px]">
        <div className="max-h-[82dvh] overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <DrawerHeader className="p-0 pb-3 text-left">
            <DrawerTitle className="font-hand text-4xl leading-none font-semibold">Add to your shop</DrawerTitle>
            <DrawerDescription>Search, set how many you have (0 is fine), tap Pick.</DrawerDescription>
          </DrawerHeader>

          <label className="relative block">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 opacity-50" />
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Search a product, like atta"
              className="h-11 w-full rounded-full border border-foreground/15 bg-card pr-4 pl-10 text-base outline-none transition-[border-color] placeholder:text-foreground/40 focus:border-foreground"
            />
          </label>

          {showResults && (
            <ul className="mt-2 max-h-60 overflow-y-auto overscroll-contain rounded-2xl border border-foreground/10 bg-card">
              {results.map((p) => {
                const isOwned = ownedIds.has(p.id)
                const isPicked = picked.some((x) => x.product.id === p.id)
                return (
                  <li key={p.id} className="flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm">
                    <span className="min-w-0">
                      <span className="line-clamp-1 font-semibold">{label(p)}</span>
                      <span className="text-xs text-muted-foreground">{[p.size, p.category].filter(Boolean).join(" · ")}</span>
                    </span>
                    {isOwned || isPicked ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-foreground/8 px-2.5 py-1 text-xs font-bold">
                        <Check className="size-3.5" /> {isOwned ? "Already added" : "Picked"}
                      </span>
                    ) : (
                      <span className="flex shrink-0 items-center gap-2">
                        <Qty value={rowQty[p.id] ?? 0} onChange={(n) => setRowQty((now) => ({ ...now, [p.id]: n }))} name={p.name} />
                        <button
                          type="button"
                          onClick={() => choose(p)}
                          className="h-8 rounded-full bg-foreground px-3 text-xs font-bold text-background active:scale-95"
                        >
                          Pick
                        </button>
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          {picked.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                {picked.length} {picked.length === 1 ? "product" : "products"} picked
              </p>
              <ul className="grid gap-2">
                {picked.map(({ product: p, qty }) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 rounded-2xl bg-foreground/8 py-1.5 pr-1.5 pl-3 text-sm">
                    <span className="min-w-0 font-semibold">
                      <span className="line-clamp-1">{label(p)}</span>
                      {p.size && <span className="text-xs font-normal text-muted-foreground">{p.size}</span>}
                    </span>
                    <span className="flex shrink-0 items-center gap-1">
                      <Qty value={qty} onChange={(n) => setPicked((now) => now.map((x) => (x.product.id === p.id ? { ...x, qty: n } : x)))} name={p.name} />
                      <button
                        type="button"
                        aria-label={`Remove ${p.name}`}
                        onClick={() => setPicked((now) => now.filter((x) => x.product.id !== p.id))}
                        className="grid size-8 place-items-center rounded-full hover:bg-foreground/10"
                      >
                        <X className="size-4" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && <p className="mt-3 text-sm font-semibold text-signal">{error}</p>}

          <div className="mt-5 grid gap-2">
            <Button onClick={addAll} disabled={!picked.length || saving} className="h-12 rounded-full text-base">
              {saving ? "Adding…" : picked.length > 1 ? `Add all ${picked.length} products` : picked.length === 1 ? "Add this product" : "Pick a product first"}
            </Button>
            <button
              type="button"
              onClick={() => {
                finish()
                onManual()
              }}
              className="py-1 text-sm font-semibold underline underline-offset-4"
            >
              Not in the list? Type it yourself
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
