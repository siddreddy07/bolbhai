"use client"

import * as React from "react"
import { Loader2, Minus, Plus, Trash2 } from "lucide-react"

import { Segmented, inr } from "@/components/dashboard/list-kit"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer"
import { SearchBox } from "@/components/ui/search-box"
import { CustomerPick } from "@/components/dashboard/bills/customer-pick"
import type { Customer } from "@/lib/customer-api"
import { useHomeStore } from "@/store/home-store"
import { useShopStore } from "@/store/shop-store"
import type { Payment, PaymentType } from "@/lib/types"
import { toast } from "sonner"

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

/** A line on the new bill. `left` is what the shelf has, so the count cannot go past it. */
type Line = {
  pid: string
  name: string
  size: string | null
  price: number
  left: number
  quantity: number
}

const PAYMENTS: { id: Payment; name: string }[] = [
  { id: "PAID", name: "Paid" },
  { id: "LEDGER", name: "Not paid" },
]
const TYPES: { id: PaymentType; name: string }[] = [
  { id: "CASH", name: "Cash" },
  { id: "UPI", name: "UPI" },
]

function Form({ onClose }: { onClose: () => void }) {
  const shop = useShopStore((s) => s.shop)
  const stock = useHomeStore((s) => s.stock)
  const saving = useHomeStore((s) => s.savingBill)
  const saveNewBill = useHomeStore((s) => s.saveNewBill)
  const [lines, setLines] = React.useState<Line[]>([])
  const [payment, setPayment] = React.useState<Payment>("LEDGER") // a new bill starts as not paid
  const [paymentType, setPaymentType] = React.useState<PaymentType>("CASH")
  const [customer, setCustomer] = React.useState<Customer | null>(null)

  const total = lines.reduce((n, l) => n + l.quantity * l.price, 0)

  /** Changes a line's count by `by`. Past what the shelf has is refused; 0 removes the line. */
  function change(pid: string, by: number) {
    const line = lines.find((l) => l.pid === pid)
    if (!line) return
    const next = line.quantity + by
    if (next > line.left) {
      toast.error(
        line.left === 0
          ? `${line.name} is out of stock`
          : `Only ${line.left} ${line.name} left`
      )
      return
    }
    setLines((all) =>
      next <= 0
        ? all.filter((l) => l.pid !== pid)
        : all.map((l) => (l.pid === pid ? { ...l, quantity: next } : l))
    )
  }

  function add(hit: InventoryHit) {
    if (!hit.productId) return // the shop's own items have no product id, so a bill cannot hold them yet
    const pid = hit.productId
    if (lines.some((l) => l.pid === pid)) return change(pid, 1)
    if (hit.stock < 1) {
      toast.error(`${hit.name} is out of stock`)
      return
    }
    setLines((all) => [
      ...all,
      {
        pid,
        name: hit.name,
        size: hit.size,
        price: hit.price,
        left: hit.stock,
        quantity: 1,
      },
    ])
  }

  async function confirm() {
    const id = await saveNewBill(
      lines.map((l) => ({ pid: l.pid, quantity: l.quantity })),
      payment,
      paymentType,
      customer
    )
    if (id) onClose()
  }

  return (
    <div className="max-h-[88dvh] overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <DrawerTitle className="sr-only">Add a new bill</DrawerTitle>
      <DrawerDescription className="sr-only">
        Search for items, set how many, then confirm the bill.
      </DrawerDescription>

      <div className="mx-auto max-w-[420px]">
        {shop && (
          <SearchBox<InventoryHit>
            className="mb-3"
            url="/api/inventory/search"
            params={{ shopId: shop.id }}
            cacheKey={stock.length}
            logLabel="inventory search"
            placeholder="Search an item to add"
            autoFocus
            clearOnSelect
            getKey={(i) => i.id}
            getLabel={(i) =>
              [i.brand, i.name, i.size].filter(Boolean).join(" ")
            }
            getHint={(i) =>
              i.productId ? inr(i.price) : "cannot be billed yet"
            }
            onSelect={add}
          />
        )}

        <div className="drop-shadow-[0_14px_24px_rgb(0_0_0/0.45)]">
          <div aria-hidden="true" className="zig-t paper h-3" />
          <div className="paper paper-grain relative px-5 pt-1 pb-5">
            <p className="text-center font-hand text-3xl leading-none">
              {shop?.name ?? "Your shop"}
            </p>
            <p className="mt-1 text-center font-mono text-[11px] opacity-60">
              new bill
            </p>
            {customer && (
              <p className="mt-1.5 text-center font-hand text-2xl leading-none">
                for {customer.name}
              </p>
            )}

            {lines.length === 0 ? (
              <p className="mt-3 border-t border-dashed border-[#1d2a22]/35 py-6 text-center font-mono text-[12px] opacity-60">
                Bol bhai, kya chahiye?
              </p>
            ) : (
              <ul className="mt-2 max-h-[min(13rem,26dvh)] overflow-y-auto overscroll-contain border-t border-dashed border-[#1d2a22]/35 py-2">
                {lines.map((l) => (
                  <li key={l.pid} className="flex items-center gap-2 py-1.5">
                    <span className="min-w-0 flex-1 font-sans text-[14px] leading-tight font-semibold">
                      {l.name}
                      {l.size && (
                        <span className="ml-1 font-mono text-[11px] font-normal opacity-60">
                          {l.size}
                        </span>
                      )}
                    </span>
                    <span className="flex shrink-0 items-center rounded-full bg-[#1d2a22]/10">
                      <button
                        type="button"
                        aria-label={`One less ${l.name}`}
                        disabled={saving}
                        onClick={() => change(l.pid, -1)}
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
                        disabled={saving}
                        onClick={() => change(l.pid, 1)}
                        className="grid size-7 place-items-center rounded-full active:bg-[#1d2a22]/15"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </span>
                    <span className="w-16 shrink-0 text-right font-mono text-[13px] font-bold tabular-nums">
                      {inr(l.quantity * l.price)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-end justify-between border-t-2 border-dashed border-[#1d2a22]/45 pt-3">
              <span className="font-mono text-sm font-bold">total</span>
              <span className="font-mono text-4xl leading-none font-extrabold tracking-tight tabular-nums">
                {inr(total)}
              </span>
            </div>
          </div>
          <div aria-hidden="true" className="zig-b paper h-3" />
        </div>

        {/* who it is for (optional) */}
        <div className="mt-4">
          <CustomerPick value={customer} onChange={setCustomer} />
        </div>

        {/* paid or not, and how */}
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

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            onClick={confirm}
            disabled={!lines.length || saving}
            className="h-12 rounded-full text-base"
          >
            {saving ? <Loader2 className="size-5 animate-spin" /> : "Confirm"}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={saving}
            className="h-12 rounded-full text-base"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

/** "Add new bill": opens from the button beside the mic, for when the voice did not work. */
export function NewBillDrawer() {
  const open = useHomeStore((s) => s.newBillOpen)
  const setOpen = useHomeStore((s) => s.setNewBillOpen)
  const saving = useHomeStore((s) => s.savingBill)
  // each time it opens it is a fresh, empty slip
  const [session, setSession] = React.useState({ open: false, n: 0 })
  if (open !== session.open) setSession({ open, n: session.n + (open ? 1 : 0) })
  return (
    <Drawer
      open={open}
      onOpenChange={(o) => !saving && setOpen(o)}
      showSwipeHandle
    >
      <DrawerContent className="mx-auto max-w-[520px]">
        <Form key={session.n} onClose={() => setOpen(false)} />
      </DrawerContent>
    </Drawer>
  )
}
