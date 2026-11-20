"use client"

import * as React from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { Minus, Plus, Trash2 } from "lucide-react"

import { CAT, CATS, UNITS, inr } from "@/components/dashboard/stock/kit"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { CatId, StockItem } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export type Draft = {
  id?: string
  name: string
  category: CatId
  unit: string
  qty: string
  max: string
  price: string
}

export const blank = (category: CatId = "cereals"): Draft => ({ name: "", category, unit: "bags", qty: "10", max: "40", price: "" })
export const fromItem = (i: StockItem): Draft => ({
  id: i.id,
  name: i.name,
  category: i.category,
  unit: i.unit,
  qty: String(i.qty),
  max: String(i.max),
  price: String(i.price),
})

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("grid gap-1.5", className)}>
      <span className="text-[13px] font-semibold">{label}</span>
      {children}
    </label>
  )
}
const inputCls =
  "h-11 w-full rounded-xl border border-foreground/20 bg-background px-3.5 text-base outline-none transition-[border-color,box-shadow] placeholder:text-foreground/35 focus:border-foreground focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--hl)_55%,transparent)]"

function EditorForm({ draft, onSave, onDelete }: { draft: Draft; onSave: (d: Draft) => void; onDelete?: () => void }) {
  const [d, setD] = React.useState<Draft>(draft)
  const [sure, setSure] = React.useState(false)
  const [err, setErr] = React.useState("")
  const box = React.useRef<HTMLDivElement>(null)
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((s) => ({ ...s, [k]: v }))
  const qty = Number(d.qty) || 0
  const isNew = !d.id

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      gsap.from("[data-fld]", { y: 14, autoAlpha: 0, duration: 0.45, stagger: 0.045, ease: "power3.out", delay: 0.1 })
    },
    { scope: box }
  )
  const save = () => {
    if (!d.name.trim()) return setErr("Give it a name. “Thing” is taken.")
    setErr("")
    onSave(d)
  }

  return (
    <div ref={box} className="max-h-[78dvh] overflow-y-auto overscroll-contain px-5 pt-1 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <DrawerHeader className="p-0 pb-3 text-left">
        <DrawerTitle className="font-hand text-4xl leading-none font-semibold">{isNew ? "New item" : "Edit item"}</DrawerTitle>
        <DrawerDescription>{isNew ? "Type the name, set the count." : "Change anything. Saved when you tap Save."}</DrawerDescription>
      </DrawerHeader>

      <div className="grid gap-3.5">
          <Field label="Name" className="" >
            <span data-fld className="block">
              <input
                value={d.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Toor dal 1 kg"
                aria-invalid={!!err}
                className={inputCls}
              />
            </span>
            {err && <span role="alert" className="text-[13px] font-medium text-signal">{err}</span>}
          </Field>
          <div data-fld className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Select value={d.category} onValueChange={(v) => v && set("category", v as CatId)} items={CATS.map((c) => ({ value: c.id, label: c.name }))}>
                <SelectTrigger className="h-11 w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Counted in">
              <Select value={d.unit} onValueChange={(v) => v && set("unit", v)} items={UNITS.map((u) => ({ value: u, label: u }))}>
                <SelectTrigger className="h-11 w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
      </div>

      {/* how many: stepper + quick chips */}
      <div data-fld className="mt-3.5 grid gap-1.5">
        <span className="text-[13px] font-semibold">How many in stock</span>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-full border border-foreground/20">
            <button type="button" aria-label="One less" onClick={() => set("qty", String(Math.max(0, qty - 1)))} className="grid size-11 place-items-center rounded-full active:bg-foreground/10">
              <Minus className="size-5" />
            </button>
            <input
              inputMode="numeric"
              aria-label="Quantity"
              value={d.qty}
              onChange={(e) => set("qty", e.target.value.replace(/\D/g, "").slice(0, 5))}
              className="h-11 w-16 bg-transparent text-center text-xl font-extrabold tabular-nums outline-none"
            />
            <button type="button" aria-label="One more" onClick={() => set("qty", String(qty + 1))} className="grid size-11 place-items-center rounded-full active:bg-foreground/10">
              <Plus className="size-5" />
            </button>
          </div>
          {[5, 10, 25].map((v) => (
            <button key={v} type="button" onClick={() => set("qty", String(qty + v))} className="h-9 rounded-full border border-foreground/20 px-3.5 text-sm font-semibold active:bg-foreground/10">
              +{v}
            </button>
          ))}
        </div>
      </div>

      <div data-fld className="mt-3.5 grid grid-cols-2 gap-3">
        <Field label="Normally keep">
          <input inputMode="numeric" value={d.max} onChange={(e) => set("max", e.target.value.replace(/\D/g, "").slice(0, 5))} className={inputCls} />
          <span className="text-[11px] text-muted-foreground">We warn you when it falls under a fifth.</span>
        </Field>
        <Field label="Price (₹)">
          <input inputMode="numeric" value={d.price} onChange={(e) => set("price", e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="0" className={inputCls} />
          <span className="text-[11px] text-muted-foreground">{d.price ? `${inr(Number(d.price))} per ${d.unit.replace(/s$/, "")}` : "Per unit"}</span>
        </Field>
      </div>

      <div data-fld className={cn("mt-5 grid gap-2", !isNew && onDelete ? "grid-cols-[auto_1fr]" : "")}>
        {!isNew && onDelete && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => (sure ? onDelete() : setSure(true))}
            className={cn("h-12 rounded-full px-4 text-base", sure ? "bg-signal text-white hover:bg-signal/90" : "text-signal")}
          >
            <Trash2 className="size-5" /> {sure ? "Sure? Delete" : "Delete"}
          </Button>
        )}
        <Button type="button" onClick={save} className="h-12 rounded-full text-base">
          {isNew ? "Add to stock" : "Save changes"}
        </Button>
      </div>
    </div>
  )
}

export function ItemEditor({
  draft,
  onClose,
  onSave,
  onDelete,
}: {
  draft: Draft | null
  onClose: () => void
  onSave: (d: Draft) => void
  onDelete?: (id: string) => void
}) {
  // keep the content mounted through the closing animation
  const [last, setLast] = React.useState<Draft | null>(null)
  if (draft && draft !== last) setLast(draft)
  const shown = draft ?? last
  return (
    <Drawer open={!!draft} onOpenChange={(o) => !o && onClose()} showSwipeHandle>
      <DrawerContent className="mx-auto max-w-[560px]">
        {shown && <EditorForm key={shown.id ?? "new"} draft={shown} onSave={onSave} onDelete={shown.id ? () => onDelete?.(shown.id!) : undefined} />}
      </DrawerContent>
    </Drawer>
  )
}

export { CAT }
