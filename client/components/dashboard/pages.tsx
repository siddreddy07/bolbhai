"use client"

import * as React from "react"
import { Check, ChevronRight, CreditCard, Loader2, X } from "lucide-react"
import { toast } from "sonner"

import { InvoiceDrawer } from "@/components/dashboard/bills/invoice-slip"
import {
  ListScreen,
  SearchBox,
  Segmented,
  inr,
} from "@/components/dashboard/list-kit"
import { billNumber, daysAgo, type KhataBill } from "@/lib/bill"
import { useHomeStore, useKhata } from "@/store/home-store"
import { payLink } from "@/lib/invoice-api"
import { useShopStore } from "@/store/shop-store"

/* ================================================================== */
/* Khata: the shop's unpaid bills, newest first, settled by hand       */
/* ================================================================== */

type KFilter = "week" | "month"

export function KhataPage() {
  const setView = useHomeStore((s) => s.setViewInvoice)
  const setPayment = useHomeStore((s) => s.setBillPayment)
  const { bills, count, totalDue } = useKhata()
  const loadBills = useHomeStore((s) => s.loadBills)
  const shopId = useShopStore((s) => s.shop?.id)
  // the khata is every unpaid bill, from any day: ask for them when the page opens
  React.useEffect(() => {
    if (shopId) void loadBills(shopId, true)
  }, [shopId, loadBills])
  const [f, setF] = React.useState<KFilter>("week")
  const [q, setQ] = React.useState("")
  const [askId, setAskId] = React.useState<string | null>(null) // the bill asking "paid by cash?"
  const [busy, setBusy] = React.useState<string | null>(null)

  async function settle(b: KhataBill, how: "CASH" | "UPI") {
    setBusy(b.id)
    await setPayment(b.id, "PAID", how) // one request; the khata follows from the bills
    setBusy(null)
    setAskId(null)
    toast.success("Marked as paid", {
      description: `${inr(b.total)} received by ${how === "UPI" ? "UPI" : "cash"}.`,
    })
  }

  // pay online: open this bill's Stripe page
  async function payNow(b: KhataBill) {
    setBusy(b.id)
    try {
      window.location.assign((await payLink(b.id)).url)
    } catch {
      setBusy(null)
      toast.error("Could not open the payment page")
    }
  }

  const needle = q.trim().toLowerCase()
  // Week: this week and the 4 before it (5 weeks). Month: this month and the 4 before it (5 months).
  const now = new Date()
  const today = new Date().setHours(0, 0, 0, 0)
  const monday = today - ((now.getDay() + 6) % 7) * 864e5
  const from =
    f === "week"
      ? monday - 28 * 864e5
      : new Date(now.getFullYear(), now.getMonth() - 4, 1).getTime()
  const inRange = bills.filter((b) => b.date >= from)
  const list = inRange.filter(
    (b) =>
      !needle ||
      billNumber(b).toLowerCase().includes(needle) ||
      b.customerName?.toLowerCase().includes(needle) ||
      b.customerPhone?.includes(needle) ||
      b.items.some((l) => l.name.toLowerCase().includes(needle))
  )
  // Week view: a card per week. Month view: a card per month, and inside it a card per week.
  const dayMs = 864e5
  const weekOf = (t: number) => {
    const d = new Date(t).setHours(0, 0, 0, 0)
    return d - ((new Date(d).getDay() + 6) % 7) * dayMs
  }
  const monthOf = (t: number) => {
    const d = new Date(t)
    return new Date(d.getFullYear(), d.getMonth(), 1).getTime()
  }
  const short = (t: number) =>
    new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
  const weeksOf = (bs: KhataBill[]) =>
    [...new Set(bs.map((x) => weekOf(x.date)))]
      .sort((x, y) => y - x)
      .map((t) => ({
        t,
        label: `${short(t)} – ${short(t + 6 * dayMs)}`,
        bills: bs.filter((x) => weekOf(x.date) === t),
      }))
  const months = [...new Set(list.map((x) => monthOf(x.date)))]
    .sort((x, y) => y - x)
    .map((t) => {
      const bs = list.filter((x) => monthOf(x.date) === t)
      return {
        t,
        label: new Date(t).toLocaleDateString("en-IN", {
          month: "long",
          year: "numeric",
        }),
        bills: bs,
        weeks: weeksOf(bs),
      }
    })
  const sum = (bs: KhataBill[]) => bs.reduce((n, x) => n + x.total, 0)
  const billsText = (bs: KhataBill[]) =>
    `${bs.length} unpaid ${bs.length === 1 ? "bill" : "bills"}`

  // one bill: its number and amount, the day and time under it, and a tick to mark it paid
  const billRow = (b: KhataBill) => {
    const days = daysAgo(b.date)
    const when = `${
      days === 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`
    } · ${new Date(b.date).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`
    return (
      <li
        key={b.id}
        className="flex items-center gap-1.5 rounded-xl bg-background py-1 pr-1.5 pl-1 ring-1 ring-foreground/10"
      >
        {askId === b.id ? (
          // ✓ confirms "paid by cash", ✗ cancels
          <>
            <p className="min-w-0 flex-1 truncate pl-2 text-sm font-semibold">
              #{billNumber(b)} paid by cash?
            </p>
            <button
              type="button"
              aria-label="Yes, paid by cash"
              disabled={busy === b.id}
              onClick={() => settle(b, "CASH")}
              className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground text-background active:scale-95 disabled:opacity-50"
            >
              <Check className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Cancel"
              onClick={() => setAskId(null)}
              className="grid size-9 shrink-0 place-items-center rounded-full border border-foreground/20 active:scale-95"
            >
              <X className="size-4" />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setView(b.id)}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-foreground/[0.07] active:bg-foreground/10"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {b.customerName ?? `Bill #${billNumber(b)}`}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {b.customerName ? `#${billNumber(b)} · ` : ""}
                  {when}
                </span>
              </span>
              <span className="font-bold tabular-nums">{inr(b.total)}</span>
            </button>
            <button
              type="button"
              aria-label="Pay now"
              disabled={busy === b.id}
              onClick={() => payNow(b)}
              className="grid size-9 shrink-0 place-items-center rounded-full border border-foreground/20 active:scale-95 disabled:opacity-50"
            >
              {busy === b.id ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CreditCard className="size-4" />
              )}
            </button>
            <button
              type="button"
              aria-label="Mark as paid"
              onClick={() => setAskId(b.id)}
              className="grid size-9 shrink-0 place-items-center rounded-full border border-foreground/20 active:scale-95"
            >
              <Check className="size-4" />
            </button>
          </>
        )}
      </li>
    )
  }
  // a week: smaller, with a coloured bar on its left
  const weekCard = (w: { t: number; label: string; bills: KhataBill[] }) => (
    <li key={w.t}>
      <details className="group rounded-xl bg-foreground/[0.05]">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5">
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">{w.label}</span>
            <span className="block text-xs text-muted-foreground">
              {billsText(w.bills)}
            </span>
          </span>
          <span className="text-base font-bold tabular-nums">
            {inr(sum(w.bills))}
          </span>
          <ChevronRight className="size-4 opacity-50 transition-transform group-open:rotate-90" />
        </summary>
        <ul className="space-y-1.5 px-1.5 pb-1.5">{w.bills.map(billRow)}</ul>
      </details>
    </li>
  )

  return (
    <ListScreen
      title="Khata"
      count={`${count} unpaid ${count === 1 ? "bill" : "bills"}`}
      controls={
        <>
          <SearchBox
            value={q}
            onChange={setQ}
            placeholder="Bill number, customer, phone or item"
          />
          <Segmented
            compact
            value={f}
            onChange={setF}
            label="Show"
            options={[
              { id: "week", name: "Last 5 weeks" },
              { id: "month", name: "Last 5 months" },
            ]}
          />
        </>
      }
    >
      {/* this stays still, only the weeks (or months) below it scroll */}
      <div className="mt-2 rounded-2xl bg-foreground/6 px-3.5 py-3 sm:px-4 sm:py-3.5">
        <p className="text-xs text-muted-foreground">Total to collect</p>
        <p className="text-2xl leading-tight font-extrabold tabular-nums sm:text-3xl">
          {inr(totalDue)}
        </p>
        {inRange.length < count && (
          <p className="mt-1 text-xs text-muted-foreground">
            {count - inRange.length} older unpaid{" "}
            {count - inRange.length === 1 ? "bill is" : "bills are"} not in this
            range.
          </p>
        )}
      </div>

      <ul className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pb-2">
        {f === "week"
          ? weeksOf(list).map(weekCard)
          : months.map((m) => (
              <li key={m.t}>
                {/* a month: bigger and bold, and its weeks are inside it */}
                <details className="group rounded-2xl bg-foreground/[0.09]">
                  <summary className="flex cursor-pointer list-none items-center gap-2 px-3.5 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-extrabold sm:text-lg">
                        {m.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {billsText(m.bills)}
                      </span>
                    </span>
                    <span className="text-lg font-extrabold tabular-nums sm:text-xl">
                      {inr(sum(m.bills))}
                    </span>
                    <ChevronRight className="size-5 opacity-60 transition-transform group-open:rotate-90" />
                  </summary>
                  <ul className="space-y-1.5 px-1.5 pb-1.5">
                    {m.weeks.map(weekCard)}
                  </ul>
                </details>
              </li>
            ))}
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
