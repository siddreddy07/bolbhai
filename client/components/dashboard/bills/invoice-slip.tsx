"use client"

import * as React from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { Check, Loader2, Minus, Plus, Trash2, X } from "lucide-react"

import { Segmented, inr } from "@/components/dashboard/list-kit"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer"
import { CustomerPick } from "@/components/dashboard/bills/customer-pick"
import { SearchBox } from "@/components/ui/search-box"
import {
  billNumber,
  daysAgo,
  invoiceTotal,
  isLocked,
  isPaid,
  lineInfo,
} from "@/lib/bill"
import { flushBill, useHomeStore } from "@/store/home-store"
import type { Invoice, Payment, PaymentType } from "@/lib/types"
import { useShopStore } from "@/store/shop-store"

/** One row of GET /api/inventory/search. */
type InventoryHit = {
  id: string
  productId: string | null
  name: string
  brand: string | null
  size: string | null
  stock: number
  price: number
}

function when(inv: Invoice) {
  const d = new Date(inv.date)
  const n = daysAgo(inv.date)
  const day =
    n === 0
      ? "Today"
      : n === 1
        ? "Yesterday"
        : d.toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })
  return `${day} · ${d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`
}

// PAID shows the paid stamp, LEDGER shows "not paid".
const STAMP = {
  PAID: { text: "PAID", colour: "#1f7a45" },
  LEDGER: { text: "NOT PAID", colour: "#d8431f" },
} as const

const PAYMENTS: { id: Payment; name: string }[] = [
  { id: "PAID", name: "Paid" },
  { id: "LEDGER", name: "Not paid" },
]
const TYPES: { id: PaymentType; name: string }[] = [
  { id: "CASH", name: "Cash" },
  { id: "UPI", name: "UPI" },
]

function Slip({ inv, onClose }: { inv: Invoice; onClose: () => void }) {
  // "delete this bill?" is kept in the store, so the lock does not depend on anything drawn on the screen
  const asking = useHomeStore((s) => s.deleteAsk === inv.id)
  const setAsking = (open: boolean) =>
    useHomeStore.getState().setDeleteAsk(open ? inv.id : null)
  const shop = useShopStore((s) => s.shop)
  const stock = useHomeStore((s) => s.stock)
  const error = useHomeStore((s) => s.billError)
  const {
    addBillItem,
    setBillQty,
    setBillPayment,
    setBillCustomer,
    removeBill,
    loadStock,
  } = useHomeStore.getState()
  const box = React.useRef<HTMLDivElement>(null)
  const [deleting, setDeleting] = React.useState(false) // the server is deleting it: nothing on the slip works
  // paid or not, and how: only a DRAFT until Done is pressed (closing any other way keeps the bill as it was)
  const [payment, setPayment] = React.useState<Payment>(inv.payment)
  const [paymentType, setPaymentType] = React.useState<PaymentType>(
    inv.paymentType
  )
  const paid = payment === "PAID"
  const locked = isLocked(inv) // saved state, so ticking Paid does not lock it until Done
  const stamp = STAMP[payment]
  const changed = payment !== inv.payment || paymentType !== inv.paymentType
  const done = () => {
    if (asking) return
    if (changed) void setBillPayment(inv.id, payment, paymentType)
    onClose()
  }

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      const tl = gsap.timeline({ delay: 0.15 })
      tl.fromTo(
        "[data-slip]",
        { clipPath: "inset(0 0 100% 0)" },
        {
          clipPath: "inset(0 0 0% 0)",
          duration: 0.7,
          ease: "steps(12)",
          clearProps: "clipPath",
        }
      )
        .from(
          "[data-li]",
          {
            y: -8,
            autoAlpha: 0,
            duration: 0.3,
            stagger: 0.07,
            ease: "power2.out",
            clearProps: "all",
          },
          "-=0.35"
        )
        .fromTo(
          "[data-stamp]",
          { scale: 2.6, autoAlpha: 0, rotation: -26 },
          {
            scale: 1,
            autoAlpha: 0.9,
            rotation: -12,
            duration: 0.4,
            ease: "back.out(2.2)",
          },
          "-=0.05"
        )
    },
    { scope: box }
  )

  // the stamp comes down again each time the choice changes (not on the first show: the slip animation does that)
  const firstStamp = React.useRef(true)
  useGSAP(
    () => {
      if (firstStamp.current) {
        firstStamp.current = false
        return
      }
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      gsap.fromTo(
        "[data-stamp]",
        { scale: 2.2, autoAlpha: 0, rotation: -24 },
        {
          scale: 1,
          autoAlpha: 0.9,
          rotation: -12,
          duration: 0.35,
          ease: "back.out(2.2)",
        }
      )
    },
    { scope: box, dependencies: [payment] }
  )

  // the bill fades out first, then the other view takes its place (so it never just jumps)
  const swap = (open: boolean) => {
    if (
      !box.current ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return setAsking(open)
    gsap.to(box.current, {
      autoAlpha: 0,
      y: open ? -8 : 8,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => setAsking(open),
    })
  }

  // the slip folds into the summary and back: the card drops in, the question pops up under it; going back fades the bill in
  const firstAsk = React.useRef(true)
  useGSAP(
    () => {
      if (firstAsk.current) {
        firstAsk.current = false
        return
      }
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      if (asking) {
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from("[data-ask-card]", {
            y: 16,
            scale: 0.96,
            autoAlpha: 0,
            duration: 0.35,
          })
          .from(
            "[data-ask-bar]",
            { y: 24, autoAlpha: 0, duration: 0.45, ease: "back.out(1.6)" },
            "-=0.2"
          )
      } else {
        gsap.from(box.current, {
          autoAlpha: 0,
          y: 10,
          duration: 0.35,
          ease: "power2.out",
        })
      }
    },
    { scope: box, dependencies: [asking] }
  )

  // "delete this bill?": the slip folds into a short summary and nothing else is drawn, so there is nothing else to click
  if (asking) {
    return (
      <div
        key="ask"
        ref={box}
        className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        <DrawerTitle className="sr-only">
          Delete bill #{billNumber(inv)}
        </DrawerTitle>
        <DrawerDescription className="sr-only">
          Are you sure you want to delete this bill?
        </DrawerDescription>
        <div className="mx-auto max-w-[420px] pt-1">
          <div
            data-ask-card
            className="rounded-2xl bg-foreground/5 px-4 py-3.5"
          >
            <p className="text-sm font-semibold">Bill #{billNumber(inv)}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(inv.date).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
            <p className="mt-2 text-3xl leading-none font-extrabold tabular-nums">
              {inr(invoiceTotal(inv, stock))}
            </p>
          </div>
          {asking ? (
            <div
              data-ask-bar
              className="mt-3 flex h-12 items-center gap-3 rounded-full bg-destructive/10 pr-1.5 pl-5"
            >
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-destructive">
                {deleting ? "Deleting…" : "Delete this bill?"}
              </span>
              <button
                type="button"
                aria-label="Yes, delete it"
                onClick={async () => {
                  setDeleting(true)
                  await removeBill(inv.id) // closes the bill when it is gone
                  setDeleting(false)
                  setAsking(false)
                }}
                className="grid size-9 place-items-center rounded-full bg-destructive text-white active:scale-95"
              >
                {deleting ? (
                  <Loader2 className="size-[18px] animate-spin" />
                ) : (
                  <Check className="size-[18px]" />
                )}
              </button>
              <button
                type="button"
                aria-label="No, keep it"
                disabled={deleting}
                onClick={() => swap(false)}
                className="grid size-9 place-items-center rounded-full bg-foreground/10 active:scale-95"
              >
                <X className="size-[18px]" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div
      key="slip"
      ref={box}
      className="max-h-[88dvh] overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
    >
      <DrawerTitle className="sr-only">Bill #{billNumber(inv)}</DrawerTitle>
      <DrawerDescription className="sr-only">
        {inr(invoiceTotal(inv, stock))}, {isPaid(inv) ? "paid" : "not paid"}
      </DrawerDescription>

      <div className="mx-auto max-w-[420px]">
        {/* add an item to this bill: the same search as the stock page, on this shop's inventory */}
        {locked && (
          <p className="mb-3 text-center text-[13px] font-medium opacity-70">
            {isPaid(inv)
              ? "Paid bills can’t be changed."
              : "This bill is over 24 hours old, so it can’t be changed."}
          </p>
        )}
        {shop && !locked && (
          <SearchBox<InventoryHit>
            className="mb-3"
            url="/api/inventory/search"
            params={{ shopId: shop.id }}
            cacheKey={stock.length}
            logLabel="inventory search"
            placeholder="Add an item to this bill"
            clearOnSelect
            getKey={(i) => i.id}
            getLabel={(i) =>
              [i.brand, i.name, i.size].filter(Boolean).join(" ")
            }
            getHint={(i) =>
              i.productId ? inr(i.price) : "cannot be billed yet"
            }
            onSelect={(i) => {
              if (asking) return
              if (!i.productId) return // the shop's own items have no product id, so a bill cannot hold them yet
              // the line shows its name and price from the saved inventory: refresh it if this item is not in there
              if (!stock.some((s) => s.productId === i.productId))
                void loadStock(shop.id, true)
              addBillItem(inv.id, i.productId)
            }}
          />
        )}
        {/* who the bill is for: can be added or changed while the bill can still be edited */}
        {!locked && (
          <div className="mb-3">
            <CustomerPick
              value={
                inv.customerId
                  ? {
                      id: inv.customerId,
                      shopId: inv.shopId,
                      name: inv.customerName ?? "Customer",
                      phone: inv.customerPhone ?? "",
                    }
                  : null
              }
              onChange={(c) => void setBillCustomer(inv.id, c)}
            />
          </div>
        )}
        {locked && inv.customerName && (
          <p className="mb-3 text-center text-[13px] font-medium">
            For {inv.customerName}
            {inv.customerPhone ? ` · ${inv.customerPhone}` : ""}
          </p>
        )}

        <div data-slip className="drop-shadow-[0_14px_24px_rgb(0_0_0/0.45)]">
          <div aria-hidden="true" className="zig-t paper h-3" />
          <div className="paper paper-grain relative px-5 pt-1 pb-5">
            <div className="text-center">
              <p className="font-hand text-3xl leading-none">
                {shop?.name ?? "Your shop"}
              </p>
              <p className="mt-1 font-mono text-[11px] opacity-60">
                bill #{billNumber(inv)} · {when(inv)}
              </p>
              {inv.customerName && (
                <p className="mt-1.5 font-hand text-2xl leading-none">
                  for {inv.customerName}
                </p>
              )}
            </div>

            {inv.items.length === 0 ? (
              <p className="mt-3 border-t border-dashed border-[#1d2a22]/35 py-6 text-center font-mono text-[12px] opacity-60">
                Bol bhai, kya chahiye?
              </p>
            ) : (
              <ul className="mt-3 border-t border-dashed border-[#1d2a22]/35 py-2">
                {inv.items.map((line) => {
                  const l = lineInfo(line, stock)
                  return (
                    <li
                      key={l.pid}
                      data-li
                      className="flex items-center gap-2 py-1.5"
                    >
                      <span className="min-w-0 flex-1 font-sans text-[14px] leading-tight font-semibold">
                        {l.name}
                        {l.size && (
                          <span className="ml-1 font-mono text-[11px] font-normal opacity-60">
                            {l.size}
                          </span>
                        )}
                      </span>
                      {locked ? (
                        <span className="shrink-0 font-mono text-[13px] font-bold tabular-nums">
                          × {l.quantity}
                        </span>
                      ) : (
                        <span className="flex shrink-0 items-center rounded-full bg-[#1d2a22]/10">
                          <button
                            type="button"
                            aria-label={`One less ${l.name}`}
                            onClick={() =>
                              setBillQty(inv.id, l.pid, l.quantity - 1)
                            }
                            className="grid size-7 place-items-center rounded-full active:bg-[#1d2a22]/15"
                          >
                            {l.quantity === 1 ? (
                              <Trash2 className="size-3.5" />
                            ) : (
                              <Minus className="size-3.5" />
                            )}
                          </button>
                          <span className="min-w-6 text-center font-mono text-[13px] font-bold tabular-nums">
                            {l.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label={`One more ${l.name}`}
                            onClick={() =>
                              setBillQty(inv.id, l.pid, l.quantity + 1)
                            }
                            className="grid size-7 place-items-center rounded-full active:bg-[#1d2a22]/15"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </span>
                      )}
                      <span className="w-16 shrink-0 text-right font-mono text-[13px] font-bold tabular-nums">
                        {inr(l.quantity * l.price)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}

            <div className="relative flex items-end justify-between border-t-2 border-dashed border-[#1d2a22]/45 pt-3">
              <span className="font-mono text-sm font-bold">total</span>
              <span className="font-mono text-4xl leading-none font-extrabold tracking-tight tabular-nums">
                {inr(invoiceTotal(inv, stock))}
              </span>
              <span
                data-stamp
                className="pointer-events-none absolute -top-7 left-[4%] rounded-[4px] border-[3px] bg-[#fbf8ee]/70 px-3 py-0.5 font-sans text-2xl font-black tracking-widest opacity-0 mix-blend-multiply"
                style={{ color: stamp.colour, borderColor: stamp.colour }}
              >
                {stamp.text}
              </span>
            </div>

            <p className="mt-4 text-center font-mono text-[11px] opacity-60">
              {paid
                ? `paid by ${paymentType === "UPI" ? "UPI" : "cash"} · thank you`
                : "in Khata"}
            </p>
          </div>
          <div aria-hidden="true" className="zig-b paper h-3" />
        </div>

        {/* paid or not, and how: saved when Done is pressed */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Segmented
            compact
            value={payment}
            onChange={setPayment}
            options={PAYMENTS}
            label="Payment"
          />
          <Segmented
            compact
            value={paymentType}
            onChange={setPaymentType}
            options={TYPES}
            label="Payment type"
          />
        </div>
        {error && (
          <p role="alert" className="mt-2 text-center text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button onClick={done} className="h-12 rounded-full text-base">
            Done
          </Button>
          <Button
            variant="ghost"
            onClick={() => swap(true)}
            className="h-12 rounded-full text-base text-destructive hover:text-destructive"
          >
            Delete bill
          </Button>
        </div>
      </div>
    </div>
  )
}

/** One drawer for every screen: set `viewInvoice` in the store and this opens. */
export function InvoiceDrawer() {
  const id = useHomeStore((s) => s.viewInvoice)
  const invoices = useHomeStore((s) => s.invoices)
  const set = useHomeStore((s) => s.setViewInvoice)
  const inv = id === null ? null : (invoices.find((i) => i.id === id) ?? null)
  // keep the last bill on screen while the drawer slides away
  const [last, setLast] = React.useState<Invoice | null>(null)
  if (inv && inv !== last) setLast(inv)
  const shown = inv ?? last
  // each time the drawer opens it is a fresh slip, so a draft that was never saved with Done does not come back
  const [session, setSession] = React.useState({ open: false, n: 0 })
  if (!!inv !== session.open)
    setSession({ open: !!inv, n: session.n + (inv ? 1 : 0) })
  const close = () => {
    if (useHomeStore.getState().deleteAsk) return // answer the question first
    if (id) void flushBill(id) // a change waiting to be saved goes now
    set(null)
  }
  return (
    <Drawer open={!!inv} onOpenChange={(o) => !o && close()} showSwipeHandle>
      <DrawerContent className="mx-auto max-w-[520px]">
        {shown && (
          <Slip key={`${shown.id}-${session.n}`} inv={shown} onClose={close} />
        )}
      </DrawerContent>
    </Drawer>
  )
}
