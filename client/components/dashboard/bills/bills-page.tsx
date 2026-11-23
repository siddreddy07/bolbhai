"use client"

import * as React from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ChevronRight, LoaderCircle, ReceiptText } from "lucide-react"

import { InvoiceDrawer } from "@/components/dashboard/bills/invoice-slip"
import {
  Chips,
  ListScreen,
  SearchBox,
  Segmented,
  inr,
} from "@/components/dashboard/list-kit"
import { billNumber, invoiceTotal, isPaid, lineInfo } from "@/lib/bill"
import { useHomeStore } from "@/store/home-store"
import type { Invoice, StockItem } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useShopStore } from "@/store/shop-store"

type Range = "today" | "week" | "month" | "year"
const RANGES: { id: Range; name: string }[] = [
  { id: "today", name: "Today" },
  { id: "week", name: "Week" },
  { id: "month", name: "Month" },
  { id: "year", name: "Year" },
]

const DAY = 864e5

const hour = (h: number) =>
  `${h % 12 || 12} ${h < 12 || h === 24 ? "am" : "pm"}`

type Status = "all" | "PAID" | "LEDGER"

export function dayLabel(d: number) {
  if (d === 0) return "Today"
  if (d === 1) return "Yesterday"
  return new Date(Date.now() - d * 864e5).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

const time = (ms: number) =>
  new Date(ms).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  })

/** One bill in a list. Tap it to open the invoice. */
export function BillRow({
  i,
  stock,
  onOpen,
}: {
  i: Invoice
  stock: StockItem[]
  onOpen: () => void
}) {
  const paid = isPaid(i)
  const count = i.items.reduce((n, l) => n + l.quantity, 0)
  return (
    <li data-line>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 border-b border-foreground/10 py-3 text-left transition-colors active:bg-foreground/5"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground/8">
          <ReceiptText className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold">
            Bill #{billNumber(i)}
          </span>
          <span className="block text-xs text-muted-foreground">
            {count} {count === 1 ? "item" : "items"} · {time(i.date)}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-0.5">
          <span className="font-bold tabular-nums">
            {inr(invoiceTotal(i, stock))}
          </span>
          <span
            className={cn(
              "text-[11px] font-semibold",
              paid ? "text-[#3fae6a]" : "text-signal"
            )}
          >
            {paid
              ? `paid · ${i.paymentType === "UPI" ? "UPI" : "cash"}`
              : "not paid"}
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 opacity-40" />
      </button>
    </li>
  )
}

export function BillsPage() {
  const invoices = useHomeStore((s) => s.invoices)
  const stock = useHomeStore((s) => s.stock)
  const loading = useHomeStore((s) => s.billsLoading)
  const error = useHomeStore((s) => s.billError)
  const loadBills = useHomeStore((s) => s.loadBills)
  const setView = useHomeStore((s) => s.setViewInvoice)
  const shopId = useShopStore((s) => s.shop?.id)
  const [range, setRange] = React.useState<Range>("today")
  const [status, setStatus] = React.useState<Status>("all")
  const [q, setQ] = React.useState("")
  const root = React.useRef<HTMLDivElement>(null)

  // opening the bills page asks the server for all of the shop's bills, newest first
  React.useEffect(() => {
    if (shopId) void loadBills(shopId, true)
  }, [shopId, loadBills])

  // each card is [label, from, to]; today is cut by two hours instead
  const now = new Date()
  const today = new Date().setHours(0, 0, 0, 0)
  const mon = today - ((now.getDay() + 6) % 7) * DAY
  const mo = (n: number) =>
    new Date(now.getFullYear(), now.getMonth() - n, 1).getTime()
  const yr = (n: number) => new Date(now.getFullYear() - n, 0, 1).getTime()
  const CARDS: Record<Range, [string, number, number?][]> = {
    today: [],
    week: [
      ["Today", today],
      ["This week", mon],
      ["Last week", mon - 7 * DAY, mon],
      ["The week before", mon - 14 * DAY, mon - 7 * DAY],
      ["Last 5 weeks", mon - 28 * DAY],
    ],
    month: [
      ["This month", mo(0)],
      ["Last month", mo(1), mo(0)],
      ["Last 5 months", mo(4)],
    ],
    year: [
      ["This year", yr(0)],
      ["Last 5 years", yr(4)],
    ],
  }
  const cards = CARDS[range]
  const head = range === "today" ? today : cards[range === "week" ? 1 : 0][1]
  const start = range === "today" ? today : cards[cards.length - 1][1]

  const inRange = invoices.filter((i) => i.date >= start)
  const totals = { paid: 0, unpaid: 0, all: 0 }
  for (const i of inRange) {
    if (i.date < head) continue
    const t = invoiceTotal(i, stock)
    if (isPaid(i)) totals.paid += t
    else totals.unpaid += t
    totals.all += t
  }
  const needle = q.trim().toLowerCase()
  const list = inRange.filter(
    (i) =>
      (status === "all" || i.payment === status) &&
      (!needle ||
        billNumber(i).toLowerCase().includes(needle) ||
        i.items.some((l) =>
          lineInfo(l, stock).name.toLowerCase().includes(needle)
        ))
  )
  let groups = cards.map(([label, from, to = Infinity]) => ({
    label,
    bills: list.filter((i) => i.date >= from && i.date < to),
  }))
  if (range === "today") {
    const slot = (i: Invoice) => Math.floor(new Date(i.date).getHours() / 2)
    groups = [...new Set(list.map(slot))]
      .sort((a, b) => b - a)
      .map((n) => ({
        label: `${hour(n * 2)} – ${hour(n * 2 + 2)}`,
        bills: list.filter((i) => slot(i) === n),
      }))
  }
  const key = `${range}|${status}|${needle}`

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      gsap.fromTo(
        "[data-line]",
        { y: 10, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.35,
          stagger: { each: 0.015, amount: 0.3 },
          ease: "power2.out",
          overwrite: true,
        }
      )
    },
    { dependencies: [key, invoices.length], scope: root }
  )

  const paidPct = totals.all ? (totals.paid / totals.all) * 100 : 0

  return (
    <div ref={root}>
      <ListScreen
        title="All bills"
        count={`${totals.all ? inr(totals.all) : "No sales"} ${range === "today" ? "today" : `this ${range}`}`}
        controls={
          <>
            <Segmented
              value={range}
              onChange={setRange}
              options={RANGES}
              label="Range"
            />
            <SearchBox
              value={q}
              onChange={setQ}
              placeholder="Search a bill number or an item"
            />
            <Chips
              value={status}
              onChange={setStatus}
              options={[
                { id: "all", name: "All" },
                { id: "PAID", name: "Paid" },
                { id: "LEDGER", name: "Not paid" },
              ]}
            />
          </>
        }
      >
        <div className="mt-3 flex items-end justify-between">
          <p className="text-3xl leading-none font-extrabold tabular-nums">
            {inr(totals.all)}
          </p>
          <p className="text-xs text-muted-foreground">
            {inr(totals.paid)} paid · {inr(totals.unpaid)} not paid
          </p>
        </div>
        <div
          className="mt-2 flex h-2 overflow-hidden rounded-full bg-foreground/10"
          aria-hidden="true"
        >
          <div className="bg-[#3fae6a]" style={{ width: `${paidPct}%` }} />
          <div className="bg-signal" style={{ width: `${100 - paidPct}%` }} />
        </div>

        <ul className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {groups.map((g) => (
            <li key={g.label} data-line>
              <details className="group rounded-2xl bg-foreground/[0.06]">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold">
                      {g.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {g.bills.length} {g.bills.length === 1 ? "bill" : "bills"}
                    </span>
                  </span>
                  <span className="text-lg font-extrabold tabular-nums">
                    {inr(
                      g.bills.reduce((a, i) => a + invoiceTotal(i, stock), 0)
                    )}
                  </span>
                  <ChevronRight className="size-4 opacity-50 transition-transform group-open:rotate-90" />
                </summary>
                <ul className="px-3 pb-2">
                  {g.bills.slice(0, 50).map((i) => (
                    <BillRow
                      key={i.id}
                      i={i}
                      stock={stock}
                      onOpen={() => setView(i.id)}
                    />
                  ))}
                  {g.bills.length > 50 && (
                    <li className="py-2 text-center text-xs text-muted-foreground">
                      Showing the latest 50. Search to find an older one.
                    </li>
                  )}
                </ul>
              </details>
            </li>
          ))}
          {loading && invoices.length === 0 ? (
            <li className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" /> Loading your
              bills…
            </li>
          ) : error && invoices.length === 0 ? (
            <li className="py-10 text-center text-sm text-destructive">
              {error}
            </li>
          ) : (
            groups.length === 0 && (
              <li className="py-10 text-center text-sm text-muted-foreground">
                {invoices.length === 0
                  ? "No bills yet. Say an order on the home page and tap Done."
                  : "No bills in this range."}
              </li>
            )
          )}
        </ul>
      </ListScreen>
      <InvoiceDrawer />
    </div>
  )
}
