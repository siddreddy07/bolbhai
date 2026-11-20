"use client"

import * as React from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ArrowRight, Check, Coffee, LoaderCircle, Lock, ShoppingBasket } from "lucide-react"

import { Logo } from "@/components/site/doodles"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/proxy"
import { GSTIN_RE, type Shop, type ShopType } from "@/lib/shop"
import { useShopStore } from "@/store/shop-store"
import { cn } from "@/lib/utils"

const TYPES: { value: ShopType; label: string; Icon: typeof Coffee }[] = [
  { value: "GROCERY", label: "Grocery", Icon: ShoppingBasket },
  { value: "CAFE", label: "Cafe", Icon: Coffee },
]

const errorText = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? fallback

function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null
  return (
    <p role="alert" className="text-[13px] font-medium text-signal">
      {children}
    </p>
  )
}

/**
 * Open/close life of a dialog. Closing is a two-step: `close(apply)` starts the exit
 * transition, and `apply` (a store update) only runs once the dialog is gone, so
 * the dashboard never changes underneath a dialog that is still fading out.
 */
function useDialogLife(onClose?: () => void, locked = false) {
  const [open, setOpen] = React.useState(true)
  const [busy, setBusy] = React.useState(false)
  const after = React.useRef<(() => void) | null>(null)

  const close = (apply?: () => void) => {
    after.current = apply ?? null
    setOpen(false)
  }

  const root = {
    open,
    // outside click and Escape close it, unless it is locked or a request is running
    onOpenChange: (next: boolean) => {
      if (!locked && !busy) setOpen(next)
    },
    onOpenChangeComplete: (next: boolean) => {
      if (next) return
      after.current?.()
      onClose?.()
    },
    disablePointerDismissal: locked,
  }
  return { root, close, setBusy }
}

/** The card's parts rise in one after the other, once, when the dialog opens. */
function useEntrance(box: React.RefObject<HTMLDivElement | null>) {
  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(gsap.utils.selector(box)("[data-in]"), { y: 14, autoAlpha: 0, duration: 0.4, ease: "power3.out", stagger: 0.07, delay: 0.08 })
      })
    },
    { scope: box }
  )
}

/* ---------------------------------- create --------------------------------- */

/**
 * `first`: the owner has no shop, so this cannot be closed. Otherwise it is "Add new shop"
 * and closes on an outside click.
 */
export function CreateShopDialog({ first = false, onClose }: { first?: boolean; onClose?: () => void }) {
  const addShop = useShopStore((s) => s.addShop)
  const { root, close, setBusy } = useDialogLife(onClose, first)

  return (
    <Dialog {...root}>
      <DialogContent>
        <CreateShopCard first={first} setBusy={setBusy} onDone={(shop) => close(() => addShop(shop))} />
      </DialogContent>
    </Dialog>
  )
}

function CreateShopCard({
  first,
  setBusy,
  onDone,
}: {
  first: boolean
  setBusy: (busy: boolean) => void
  onDone: (shop: Shop) => void
}) {
  const box = React.useRef<HTMLDivElement>(null)
  const [name, setName] = React.useState("")
  const [type, setType] = React.useState<ShopType>("GROCERY")
  const [gstin, setGstin] = React.useState("")
  const [errs, setErrs] = React.useState<{ name?: string; gstin?: string; form?: string }>({})
  const [sending, setSending] = React.useState(false)
  const [created, setCreated] = React.useState<Shop | null>(null)

  useEntrance(box)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const g = gstin.trim().toUpperCase()
    const next: typeof errs = {}
    if (!name.trim()) next.name = "Your shop needs a name."
    if (!GSTIN_RE.test(g)) next.gstin = "A GSTIN is 15 characters, like 36ABCDE1234F1Z5."
    setErrs(next)
    if (next.name || next.gstin) return

    setSending(true)
    setBusy(true)
    try {
      const { data } = await api.post<Shop>("/api/shops", { name: name.trim(), type, gstin: g })
      setCreated(data)
    } catch (error) {
      setErrs({ form: errorText(error, "Could not create your shop. Try again.") })
      setSending(false)
      setBusy(false)
    }
  }

  // Shop saved: the tick pops, holds a moment, then the dialog closes.
  useGSAP(
    () => {
      if (!created) return
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(box)
        gsap
          .timeline({ onComplete: () => onDone(created) })
          .from(q("[data-done]"), { scale: 0.6, autoAlpha: 0, duration: 0.45, ease: "back.out(2)" })
          .from(q("[data-tick]"), { scale: 0, duration: 0.3, ease: "back.out(3)" }, "-=0.2")
          .to({}, { duration: 0.7 })
      })
      mm.add("(prefers-reduced-motion: reduce)", () => {
        const t = window.setTimeout(() => onDone(created), 900)
        return () => window.clearTimeout(t)
      })
    },
    { dependencies: [created], scope: box }
  )

  if (created) {
    return (
      <div ref={box} aria-live="polite" className="grid justify-items-center gap-3 py-10 text-center">
        <span data-done className="grid size-16 place-items-center rounded-full bg-[#bfe8c4] text-[#10301f]">
          <Check data-tick className="size-8" strokeWidth={3} />
        </span>
        <p className="text-2xl font-extrabold">{created.name} is ready.</p>
        <p className="text-sm text-muted-foreground">{first ? "Opening your dashboard." : "Switching to it now."}</p>
      </div>
    )
  }

  return (
    <div ref={box}>
      <div data-in className="mb-5">
        <Logo />
      </div>
      <div data-in>
        <DialogTitle>{first ? "Set up your shop" : "Add a new shop"}</DialogTitle>
        <DialogDescription className="mt-1.5">{first ? "Three details and you are in." : "Each shop has its own GSTIN."}</DialogDescription>
      </div>

      <form onSubmit={submit} noValidate className="mt-5 grid gap-4">
        <div data-in className="grid gap-1.5">
          <Label htmlFor="shop-name">Shop name</Label>
          <Input
            id="shop-name"
            autoFocus
            autoComplete="organization"
            value={name}
            placeholder="Sri Lakshmi Traders"
            aria-invalid={!!errs.name}
            onChange={(e) => setName(e.target.value)}
            className="h-11"
          />
          <FieldError>{errs.name}</FieldError>
        </div>

        <div data-in className="grid gap-1.5">
          <Label id="shop-type">Shop type</Label>
          <div role="radiogroup" aria-labelledby="shop-type" className="grid grid-cols-2 gap-2">
            {TYPES.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={type === value}
                onClick={() => setType(value)}
                className={cn(
                  "flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-[background-color,color,border-color,transform] outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97]",
                  type === value ? "border-foreground bg-foreground text-background" : "border-input hover:bg-foreground/[0.06]"
                )}
              >
                <Icon className="size-4.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div data-in className="grid gap-1.5">
          <Label htmlFor="shop-gstin">GSTIN</Label>
          <Input
            id="shop-gstin"
            value={gstin}
            placeholder="36ABCDE1234F1Z5"
            aria-invalid={!!errs.gstin}
            onChange={(e) => setGstin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15))}
            className="h-11 font-mono tracking-wider uppercase"
          />
          <FieldError>{errs.gstin}</FieldError>
        </div>

        <FieldError>{errs.form}</FieldError>

        <Button data-in type="submit" size="lg" disabled={sending} className="mt-1 h-12 w-full rounded-full text-base">
          {sending && <LoaderCircle className="size-4 animate-spin" />}
          {sending ? "Creating shop" : "Create shop"}
          {!sending && <ArrowRight className="size-4" />}
        </Button>
      </form>
    </div>
  )
}

/* ----------------------------------- edit ---------------------------------- */

/** Rename a shop or delete it. The GSTIN is shown but never editable. */
export function EditShopDialog({ shop, onClose }: { shop: Shop; onClose?: () => void }) {
  const { updateShop, removeShop } = useShopStore.getState()
  const { root, close, setBusy } = useDialogLife(onClose)

  return (
    <Dialog {...root}>
      <DialogContent>
        <EditShopCard
          shop={shop}
          setBusy={setBusy}
          onCancel={() => close()}
          onSaved={(saved) => close(() => updateShop(saved))}
          onDeleted={() => close(() => removeShop(shop.id))}
        />
      </DialogContent>
    </Dialog>
  )
}

function EditShopCard({
  shop,
  setBusy,
  onCancel,
  onSaved,
  onDeleted,
}: {
  shop: Shop
  setBusy: (busy: boolean) => void
  onCancel: () => void
  onSaved: (shop: Shop) => void
  onDeleted: () => void
}) {
  const box = React.useRef<HTMLDivElement>(null)
  const [name, setName] = React.useState(shop.name ?? "")
  const [confirming, setConfirming] = React.useState(false)
  const [sending, setSending] = React.useState<"save" | "delete" | null>(null)
  const [error, setError] = React.useState<string>()

  useEntrance(box)

  const run = async (kind: "save" | "delete", request: () => Promise<void>) => {
    setSending(kind)
    setBusy(true)
    setError(undefined)
    try {
      await request()
    } catch (e) {
      setError(errorText(e, kind === "save" ? "Could not save the name. Try again." : "Could not delete the shop. Try again."))
      setSending(null)
      setBusy(false)
    }
  }

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const next = name.trim()
    if (!next) return setError("Your shop needs a name.")
    void run("save", async () => {
      const { data } = await api.put<Shop>(`/api/shops/${shop.id}`, { name: next })
      onSaved(data)
    })
  }

  const remove = () =>
    void run("delete", async () => {
      await api.delete(`/api/shops/${shop.id}`)
      onDeleted()
    })

  if (confirming) {
    return (
      <div ref={box} data-in>
        <DialogTitle>Delete {shop.name}?</DialogTitle>
        <DialogDescription className="mt-1.5">Its stock goes with it. This cannot be undone.</DialogDescription>
        <div className="mt-4">
          <FieldError>{error}</FieldError>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button variant="outline" size="lg" disabled={sending !== null} onClick={() => setConfirming(false)} className="h-12 rounded-full text-base">
            Keep shop
          </Button>
          <Button variant="destructive" size="lg" disabled={sending !== null} onClick={remove} className="h-12 rounded-full text-base">
            {sending === "delete" && <LoaderCircle className="size-4 animate-spin" />}
            Delete shop
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div ref={box}>
      <div data-in>
        <DialogTitle>Edit shop</DialogTitle>
        <DialogDescription className="mt-1.5">You can change the name. The GSTIN stays fixed.</DialogDescription>
      </div>

      <form onSubmit={save} noValidate className="mt-5 grid gap-4">
        <div data-in className="grid gap-1.5">
          <Label htmlFor="edit-name">Shop name</Label>
          <Input
            id="edit-name"
            autoFocus
            value={name}
            aria-invalid={!!error && !name.trim()}
            onChange={(e) => setName(e.target.value)}
            className="h-11"
          />
        </div>

        <div data-in className="grid gap-1.5">
          <Label htmlFor="edit-gstin">GSTIN</Label>
          <div className="relative">
            <Input id="edit-gstin" value={shop.gstin} disabled readOnly className="h-11 pr-10 font-mono tracking-wider" />
            <Lock aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <FieldError>{error}</FieldError>

        <div data-in className="mt-1 grid gap-2">
          <Button type="submit" size="lg" disabled={sending !== null || name.trim() === (shop.name ?? "")} className="h-12 w-full rounded-full text-base">
            {sending === "save" && <LoaderCircle className="size-4 animate-spin" />}
            {sending === "save" ? "Saving" : "Save changes"}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="default" size="lg" disabled={sending !== null} onClick={onCancel} className="h-11 rounded-full hover:text-background bg-zinc-300 hover:bg-zinc-200">
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="lg"
              disabled={sending !== null}
              onClick={() => setConfirming(true)}
              className="h-11 rounded-full hover:bg-red-500 text-zinc-200 font-bold bg-red-400 hover:text-white"
            >
              Delete shop
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
