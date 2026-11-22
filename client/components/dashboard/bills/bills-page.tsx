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
  Sentinel,
  inr,
  useBatches,
} from "@/components/dashboard/list-kit"
import { billNumber, daysAgo, invoiceTotal, isPaid, lineInfo } from "@/lib/bill"
import { useHomeStore } from "@/lib/home-store"
import type { Invoice, StockItem } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useShopStore } from "@/store/shop-store"

type Range = "today" | "week" | "month" | "year"
const RANGES: { id: Range; name: string; max: number }[] = [
  { id: "today", name: "Today", max: 1 },
  { id: "week", name: "Week", max: 7 },
  { id: "month", name: "Month", max: 30 },
  { id: "year", name: "Year", max: 365 },
]
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

  const max = RANGES.find((r) => r.id === range)!.max
  const inRange = React.useMemo(
    () => invoices.filter((i) => daysAgo(i.date) < max),
    [invoices, max]
  )
  const totals = React.useMemo(() => {
    let paid = 0
    let unpaid = 0
    for (const i of inRange) {
      const t = invoiceTotal(i, stock)
      if (isPaid(i)) paid += t
      else unpaid += t
    }
    return { paid, unpaid, all: paid + unpaid }
  }, [inRange, stock])
  const needle = q.trim().toLowerCase()
  const list = React.useMemo(
    () =>
      inRange.filter(
        (i) =>
          (status === "all" || i.payment === status) &&
          (!needle ||
            billNumber(i).toLowerCase().includes(needle) ||
            i.items.some((l) =>
              lineInfo(l, stock).name.toLowerCase().includes(needle)
            ))
      ),
    [inRange, status, needle, stock]
  )
  const days = React.useMemo(() => {
    const m = new Map<number, { n: number; sum: number }>()
    list.forEach((i) => {
      const k = daysAgo(i.date)
      const d = m.get(k) ?? { n: 0, sum: 0 }
      d.n++
      d.sum += invoiceTotal(i, stock)
      m.set(k, d)
    })
    return m
  }, [list, stock])
  const key = `${range}|${status}|${needle}`
  const { shown, more, sentinel } = useBatches(list, key, 40)

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
        count={`${list.length.toLocaleString("en-IN")} ${list.length === 1 ? "bill" : "bills"}${needle || status !== "all" ? " match" : ""}`}
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

        <ul className="mt-1 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {shown.map((i, idx) => {
            const first =
              idx === 0 || daysAgo(shown[idx - 1].date) !== daysAgo(i.date)
            const d = days.get(daysAgo(i.date))
            return (
              <React.Fragment key={i.id}>
                {first && (
                  <li
                    suppressHydrationWarning
                    className="sticky top-0 z-10 flex justify-between bg-background/95 py-1.5 text-xs font-bold text-muted-foreground backdrop-blur"
                  >
                    <span>{dayLabel(daysAgo(i.date))}</span>
                    <span className="font-medium">
                      {d?.n} · {inr(d?.sum ?? 0)}
                    </span>
                  </li>
                )}
                <BillRow i={i} stock={stock} onOpen={() => setView(i.id)} />
              </React.Fragment>
            )
          })}
          <Sentinel
            more={more}
            innerRef={sentinel}
            left={list.length - shown.length}
          />
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
            list.length === 0 && (
              <li className="py-10 text-center text-sm text-muted-foreground">
                {invoices.length === 0
                  ? "No bills yet. Say an order on the home page and tap Done."
                  : "Nothing matches."}
              </li>
            )
          )}
        </ul>
      </ListScreen>
      <InvoiceDrawer />
    </div>
  )
}
