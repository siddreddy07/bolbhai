"use client"

import * as React from "react"
import { Check, ChevronRight } from "lucide-react"
import { toast } from "sonner"

import { InvoiceDrawer } from "@/components/dashboard/bills/invoice-slip"
import {
  Chips,
  ListScreen,
  SearchBox,
  Sentinel,
  inr,
  useBatches,
} from "@/components/dashboard/list-kit"
import { daysAgo, type KhataBill } from "@/lib/bill"
import { useHomeStore, useKhata } from "@/store/home-store"
import { cn } from "@/lib/utils"

/* ================================================================== */
/* Khata: the shop's unpaid bills, newest first, settled by hand       */
/* ================================================================== */

type KFilter = "all" | "late"

export function KhataPage() {
  const setView = useHomeStore((s) => s.setViewInvoice)
  const setPayment = useHomeStore((s) => s.setBillPayment)
  const { bills, count, totalDue } = useKhata()
  const [f, setF] = React.useState<KFilter>("all")
  const [q, setQ] = React.useState("")
  const [openId, setOpenId] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState<string | null>(null)

  async function settle(b: KhataBill, how: "CASH" | "UPI") {
    setBusy(b.id)
    await setPayment(b.id, "PAID", how) // one request; the khata follows from the bills
    setBusy(null)
    setOpenId(null)
    toast.success("Marked as paid", {
      description: `${inr(b.total)} received by ${how === "UPI" ? "UPI" : "cash"}.`,
    })
  }

  const needle = q.trim().toLowerCase()
  const list = React.useMemo(
    () =>
      bills
        .filter((b) => f === "all" || daysAgo(b.date) >= 14)
        .filter(
          (b) =>
            !needle ||
            b.items.some((l) => l.name.toLowerCase().includes(needle))
        ),
    [bills, f, needle]
  )
  const { shown, more, sentinel } = useBatches(list, `${f}|${needle}`)

  return (
    <ListScreen
      title="Khata"
      count={`${count} unpaid ${count === 1 ? "bill" : "bills"}`}
      controls={
        <>
          <SearchBox
            value={q}
            onChange={setQ}
            placeholder="Search an item on a bill"
          />
          <Chips
            value={f}
            onChange={setF}
            options={[
              { id: "all", name: "All unpaid" },
              { id: "late", name: "14+ days late" },
            ]}
          />
        </>
      }
    >
      <div className="mt-3">
        <p className="text-xs text-muted-foreground">Total to collect</p>
        <p className="text-3xl leading-none font-extrabold tabular-nums">
          {inr(totalDue)}
        </p>
      </div>

      <ul className="mt-2 min-h-0 flex-1 divide-y divide-foreground/10 overflow-y-auto overscroll-contain pr-1 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {shown.map((b) => {
          const days = daysAgo(b.date)
          return (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => setOpenId(openId === b.id ? null : b.id)}
                aria-expanded={openId === b.id}
                className="flex w-full items-center justify-between gap-3 py-3 text-left"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold">
                    {b.items.map((l) => l.name).join(", ")}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {b.itemCount} {b.itemCount === 1 ? "item" : "items"} ·{" "}
                    {days === 0
                      ? "today"
                      : days === 1
                        ? "yesterday"
                        : `${days} days ago`}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <span className="font-bold tabular-nums">{inr(b.total)}</span>
                  <ChevronRight
                    className={cn(
                      "size-4 opacity-50 transition-transform",
                      openId === b.id && "rotate-90"
                    )}
                  />
                </span>
              </button>
              {openId === b.id && (
                <div className="mb-3 rounded-2xl bg-foreground/[0.05] p-3">
                  <ul className="space-y-1 text-sm">
                    {b.items.map((l) => (
                      <li key={l.pid} className="flex justify-between gap-3">
                        <span className="min-w-0 truncate">
                          {l.quantity} × {l.name}
                          {l.size ? ` ${l.size}` : ""}
                        </span>
                        <span className="tabular-nums">
                          {inr(l.quantity * l.price)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {(["CASH", "UPI"] as const).map((how) => (
                      <button
                        key={how}
                        type="button"
                        disabled={busy === b.id}
                        onClick={() => settle(b, how)}
                        className="flex h-10 items-center justify-center gap-1 rounded-full bg-foreground text-sm font-semibold text-background active:scale-95 disabled:opacity-50"
                      >
                        <Check className="size-4" />{" "}
                        {how === "CASH" ? "Cash" : "UPI"}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setView(b.id)}
                      className="h-10 rounded-full border border-foreground/20 text-sm font-semibold active:scale-95"
                    >
                      Open bill
                    </button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
        <Sentinel
          more={more}
          innerRef={sentinel}
          left={list.length - shown.length}
        />
        {list.length === 0 && (
          <li className="py-10 text-center text-sm text-muted-foreground">
            {bills.length === 0
              ? "No unpaid bills. Everyone has paid."
              : "No unpaid bill matches."}
          </li>
        )}
      </ul>
      <InvoiceDrawer />
    </ListScreen>
  )
}
