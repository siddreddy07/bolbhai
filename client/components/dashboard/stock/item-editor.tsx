"use client"

import * as React from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ChevronLeft, Minus, Plus, Trash2 } from "lucide-react"

import { CAT, CATS } from "@/components/dashboard/stock/kit"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CatId, StockItem } from "@/lib/types"
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

export const blank = (category: CatId = "cereals"): Draft => ({
  name: "",
  category,
  unit: "pcs",
  qty: "10",
  max: "40",
  price: "",
})
export const fromItem = (i: StockItem): Draft => ({
  id: i.id,
  name: i.name,
  category: i.category,
  unit: i.unit,
  qty: String(i.qty),
  max: String(i.max),
  price: String(i.price),
})

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={cn("grid gap-1", className)}>
      <span className="text-xs font-semibold text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  )
}
// 16px text keeps phones from zooming in when a field is tapped
const inputCls =
  "h-10 w-full rounded-lg border border-foreground/20 bg-background px-3 text-base outline-none transition-[border-color,box-shadow] placeholder:text-foreground/35 focus:border-foreground focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--hl)_55%,transparent)]"
const selectCls = "h-10 w-full rounded-lg"
// a field that cannot be changed (editing an item that came from the catalog)
const lockedCls = "disabled:cursor-not-allowed disabled:bg-foreground/5 disabled:text-foreground/60"

function EditorForm({
  draft,
  onSave,
  onDelete,
  onBack,
}: {
  draft: Draft
  onSave: (d: Draft) => void
  onDelete?: () => void
  onBack?: () => void
}) {
  const [d, setD] = React.useState<Draft>(draft)
  const [sure, setSure] = React.useState(false)
  const [err, setErr] = React.useState("")
  const box = React.useRef<HTMLDivElement>(null)
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setD((s) => ({ ...s, [k]: v }))
  const qty = Number(d.qty) || 0
  const isNew = !d.id

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      gsap.from("[data-fld]", {
        y: 10,
        autoAlpha: 0,
        duration: 0.35,
        stagger: 0.035,
        ease: "power3.out",
        delay: 0.08,
      })
    },
    { scope: box }
  )
  const save = () => {
    if (!d.name.trim()) return setErr("Give it a name. “Thing” is taken.")
    setErr("")
    onSave(d)
  }

  const step =
    "grid size-10 place-items-center rounded-full active:bg-foreground/10"

  return (
    <div
      ref={box}
      className="max-h-[78dvh] overflow-y-auto overscroll-contain px-4 pt-0 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <DrawerHeader className="p-0 pb-2 text-left">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-1 -ml-1 flex items-center gap-0.5 text-sm font-semibold underline-offset-4 hover:underline"
          >
            <ChevronLeft className="size-4" /> Back to the list
          </button>
        )}
        <DrawerTitle className="font-hand text-3xl leading-none font-semibold">
          {isNew ? "New item" : "Edit item"}
        </DrawerTitle>
        <DrawerDescription className="sr-only">
          {isNew
            ? "Type the name, set the count."
            : "Change the count, then tap Save."}
        </DrawerDescription>
      </DrawerHeader>

      <div className="grid gap-2.5">
        <div data-fld>
          <Field label="Name">
            <input
              value={d.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Toor dal 1 kg"
              aria-invalid={!!err}
              disabled={!isNew}
              className={cn(inputCls, lockedCls)}
            />
          </Field>
          {err && (
            <p role="alert" className="mt-1 text-xs font-medium text-signal">
              {err}
            </p>
          )}
        </div>

        <div data-fld className="grid grid-cols-2 gap-2.5">
          <Field label="Category">
            <Select
              value={d.category}
              onValueChange={(v) => v && set("category", v as CatId)}
              items={CATS.map((c) => ({ value: c.id, label: c.name }))}
              disabled={!isNew}
            >
              <SelectTrigger className={cn(selectCls, lockedCls)}>
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
          <Field label="Price (₹)">
            <input
              inputMode="numeric"
              value={d.price}
              onChange={(e) =>
                set("price", e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="0"
              disabled={!isNew}
              className={cn(inputCls, lockedCls)}
            />
          </Field>
        </div>

        {/* the count: the one thing that can always be changed */}
        <div data-fld className="grid gap-1">
          <span className="text-xs font-semibold text-muted-foreground">
            In stock
          </span>
          <div className="flex h-10 items-center justify-between rounded-lg border border-foreground/20">
            <button
              type="button"
              aria-label="One less"
              onClick={() => set("qty", String(Math.max(0, qty - 1)))}
              className={step}
            >
              <Minus className="size-4" />
            </button>
            <input
              inputMode="numeric"
              aria-label="Quantity"
              value={d.qty}
              onChange={(e) =>
                set("qty", e.target.value.replace(/\D/g, "").slice(0, 5))
              }
              className="h-10 w-full min-w-0 bg-transparent text-center text-lg font-extrabold tabular-nums outline-none"
            />
            <button
              type="button"
              aria-label="One more"
              onClick={() => set("qty", String(qty + 1))}
              className={step}
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div data-fld className="mt-3.5 flex gap-2">
        {!isNew && onDelete && (
          <Button
            type="button"
            variant="ghost"
            aria-label={sure ? "Tap again to delete" : "Delete"}
            onClick={() => (sure ? onDelete() : setSure(true))}
            className={cn(
              "h-11 shrink-0 rounded-full px-4 text-sm",
              sure ? "bg-signal text-white hover:bg-signal/90" : "text-signal"
            )}
          >
            <Trash2 className="size-4" /> {sure ? "Sure? Delete" : "Delete"}
          </Button>
        )}
        <Button
          type="button"
          onClick={save}
          className="h-11 flex-1 rounded-full text-base"
        >
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
  onBack,
}: {
  draft: Draft | null
  onClose: () => void
  onSave: (d: Draft) => void
  onDelete?: (id: string) => void
  /** a new item that came from "Add to your shop": a way back to it */
  onBack?: () => void
}) {
  // keep the content mounted through the closing animation
  const [last, setLast] = React.useState<Draft | null>(null)
  if (draft && draft !== last) setLast(draft)
  const shown = draft ?? last
  return (
    <Drawer
      open={!!draft}
      onOpenChange={(o) => !o && onClose()}
      showSwipeHandle
    >
      <DrawerContent className="mx-auto max-w-[560px]">
        {shown && (
          <EditorForm
            key={shown.id ?? "new"}
            draft={shown}
            onSave={onSave}
            onDelete={shown.id ? () => onDelete?.(shown.id!) : undefined}
            onBack={shown.id ? undefined : onBack}
          />
        )}
      </DrawerContent>
    </Drawer>
  )
}

export { CAT }
