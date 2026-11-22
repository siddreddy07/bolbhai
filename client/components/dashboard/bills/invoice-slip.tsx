"use client"

import * as React from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { Minus, Plus, Trash2 } from "lucide-react"

import { inr } from "@/components/dashboard/list-kit"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer"
import { SearchBox } from "@/components/ui/search-box"
import { daysAgo } from "@/lib/bill"
import { useHomeStore } from "@/lib/home-store"
import type { Invoice } from "@/lib/types"
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
  const d = new Date(inv.createdAt)
  const n = daysAgo(inv.createdAt)
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

const STAMP = {
  Paid: { text: "PAID", colour: "#1f7a45", note: "paid in full · thank you" },
  Khata: {
    text: "KHATA",
    colour: "#d8431f",
    note: "not paid yet · written in the khata",
  },
  Open: { text: "", colour: "", note: "not paid yet · add more items below" },
} as const

function Slip({ inv, onClose }: { inv: Invoice; onClose: () => void }) {
  const shop = useShopStore((s) => s.shop)
  const stock = useHomeStore((s) => s.stock)
  const { addBillItem, setBillQty, setBillWho, setBillStatus, removeBill } =
    useHomeStore.getState()
  const box = React.useRef<HTMLDivElement>(null)
  const open = inv.status === "Open"
  const stamp = STAMP[inv.status]

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

  return (
    <div
      ref={box}
      className="max-h-[88dvh] overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
    >
      <DrawerTitle className="sr-only">Bill #{inv.id}</DrawerTitle>
      <DrawerDescription className="sr-only">
        {inv.who}, {inr(inv.amount)},{" "}
        {open ? "not paid yet" : inv.status === "Khata" ? "on khata" : "paid"}
      </DrawerDescription>

      <div className="mx-auto max-w-[420px]">
        {/* add items to a bill that is still open: the same search as the stock page, on this shop's inventory */}
        {open && shop && (
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
            getHint={(i) => inr(i.price)}
            onSelect={(i) =>
              addBillItem(inv.id, {
                itemId: i.id,
                name: i.name,
                size: i.size,
                qty: 1,
                price: i.price,
              })
            }
          />
        )}

        <div data-slip className="drop-shadow-[0_14px_24px_rgb(0_0_0/0.45)]">
          <div aria-hidden="true" className="zig-t paper h-3" />
          <div className="paper paper-grain relative px-5 pt-1 pb-5">
            <div className="text-center">
              <p className="font-hand text-3xl leading-none">
                {shop?.name ?? "Your shop"}
              </p>
              <p className="mt-1 font-mono text-[11px] opacity-60">
                bill #{inv.id} · {when(inv)}
              </p>
            </div>

            <div className="mt-3 flex items-center gap-2 border-y border-dashed border-[#1d2a22]/35 py-2 font-mono text-[12px]">
              <span className="opacity-60">for </span>
              {open ? (
                <input
                  value={inv.who}
                  onChange={(e) => setBillWho(inv.id, e.target.value)}
                  aria-label="Customer name"
                  maxLength={40}
                  className="min-w-0 flex-1 rounded border border-dashed border-[#1d2a22]/30 bg-transparent px-1.5 py-0.5 font-sans text-[15px] font-bold outline-none focus:border-[#1d2a22] focus:bg-white/60"
                />
              ) : (
                <span className="font-sans text-[15px] font-bold">
                  {inv.who}
                </span>
              )}
            </div>

            {inv.items.length === 0 ? (
              <p className="py-6 text-center font-mono text-[12px] opacity-60">
                Nothing on this bill yet. Search above to add an item.
              </p>
            ) : (
              <ul className="py-2">
                {inv.items.map((l) => (
                  <li
                    key={l.itemId}
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
                      {!open && (
                        <span className="ml-1 font-mono text-[11px] font-normal opacity-60">
                          × {l.qty}
                        </span>
                      )}
                    </span>
                    {open && (
                      <span className="flex shrink-0 items-center rounded-full bg-[#1d2a22]/10">
                        <button
                          type="button"
                          aria-label={`One less ${l.name}`}
                          onClick={() =>
                            setBillQty(inv.id, l.itemId, l.qty - 1)
                          }
                          className="grid size-7 place-items-center rounded-full active:bg-[#1d2a22]/15"
                        >
                          {l.qty === 1 ? (
                            <Trash2 className="size-3.5" />
                          ) : (
                            <Minus className="size-3.5" />
                          )}
                        </button>
                        <span className="min-w-6 text-center font-mono text-[13px] font-bold tabular-nums">
                          {l.qty}
                        </span>
                        <button
                          type="button"
                          aria-label={`One more ${l.name}`}
                          onClick={() =>
                            setBillQty(inv.id, l.itemId, l.qty + 1)
                          }
                          className="grid size-7 place-items-center rounded-full active:bg-[#1d2a22]/15"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </span>
                    )}
                    <span className="w-16 shrink-0 text-right font-mono text-[13px] font-bold tabular-nums">
                      {inr(l.qty * l.price)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="relative flex items-end justify-between border-t-2 border-dashed border-[#1d2a22]/45 pt-3">
              <span className="font-mono text-sm font-bold">total</span>
              <span className="font-mono text-4xl leading-none font-extrabold tracking-tight tabular-nums">
                {inr(inv.amount)}
              </span>
              {stamp.text && (
                <span
                  data-stamp
                  className="pointer-events-none absolute -top-7 left-[4%] rounded-[4px] border-[3px] bg-[#fbf8ee]/70 px-3 py-0.5 font-sans text-2xl font-black tracking-widest opacity-0 mix-blend-multiply"
                  style={{ color: stamp.colour, borderColor: stamp.colour }}
                >
                  {stamp.text}
                </span>
              )}
            </div>

            <p className="mt-4 text-center font-mono text-[11px] opacity-60">
              {stamp.note}
            </p>
          </div>
          <div aria-hidden="true" className="zig-b paper h-3" />
        </div>

        {open ? (
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button
              disabled={inv.items.length === 0}
              onClick={() => {
                setBillStatus(inv.id, "Paid")
              }}
              className="h-12 rounded-full text-base"
            >
              Mark paid
            </Button>
            <Button
              variant="outline"
              disabled={inv.items.length === 0}
              onClick={() => setBillStatus(inv.id, "Khata")}
              className="h-12 rounded-full text-base"
            >
              Put on khata
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="h-11 rounded-full text-base"
            >
              Close
            </Button>
            <Button
              variant="ghost"
              onClick={() => removeBill(inv.id)}
              className="h-11 rounded-full text-base text-destructive hover:text-destructive"
            >
              Delete bill
            </Button>
          </div>
        ) : (
          <Button
            onClick={onClose}
            className="mt-5 flex h-12 w-full rounded-full text-base"
          >
            Done
          </Button>
        )}
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
  return (
    <Drawer open={!!inv} onOpenChange={(o) => !o && set(null)} showSwipeHandle>
      <DrawerContent className="mx-auto max-w-[520px]">
        {shown && (
          <Slip
            key={`${shown.id}-${shown.status}`}
            inv={shown}
            onClose={() => set(null)}
          />
        )}
      </DrawerContent>
    </Drawer>
  )
}
