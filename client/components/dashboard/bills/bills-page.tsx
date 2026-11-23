"use client"

import * as React from "react"
import {
  CalendarDays,
  ChevronRight,
  LoaderCircle,
  ReceiptText,
} from "lucide-react"

import { InvoiceDrawer } from "@/components/dashboard/bills/invoice-slip"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ListScreen, SearchBox, inr } from "@/components/dashboard/list-kit"
import { billNumber, dayKey, daysAgo, invoiceTotal, isPaid } from "@/lib/bill"
import { useHomeStore } from "@/store/home-store"
import type { Invoice, StockItem } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useShopStore } from "@/store/shop-store"

/** "3:45 pm" for today's bills, "12 Nov, 3:45 pm" for older ones */
const when = (ms: number) => {
  const time = new Date(ms).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
  if (daysAgo(ms) === 0) return time
  const day = new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  })
  return `${day}, ${time}`
}

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
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-2.5 border-b border-foreground/10 py-2.5 text-left transition-colors hover:bg-foreground/[0.04] active:bg-foreground/5 sm:gap-3 sm:py-3"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground/8 sm:size-10">
          <ReceiptText className="size-[18px] sm:size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold">
            Bill #{billNumber(i)}
          </span>
          <span className="block text-xs text-muted-foreground">
            {count} {count === 1 ? "item" : "items"} · {when(i.date)}
            {i.customerName ? ` · ${i.customerName}` : ""}
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
            {paid ? "paid" : "not paid"}
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
  const analytics = useHomeStore((s) => s.analytics)
  const findBills = useHomeStore((s) => s.findBills)
  const setView = useHomeStore((s) => s.setViewInvoice)
  const shopId = useShopStore((s) => s.shop?.id)

  const [now] = React.useState(() => Date.now()) // when the page opened
  const today = dayKey(now)
  const [calendar, setCalendar] = React.useState(false)
  const [day, setDay] = React.useState(today) // the day being looked at
  const [q, setQ] = React.useState("") // a bill number being looked up
  // what was already asked from the server: "day:2026-11-20" or "find:3fa" -> the ids of the bills it gave.
  // null = it failed. Asking the same thing again costs nothing: it is answered from here.
  const [asked, setAsked] = React.useState<Record<string, string[] | null>>({})

  const word = q.trim().toLowerCase()
  const searching = word !== ""
  const fromToday = !searching && day === today // came with the dashboard's request
  const key = searching ? `find:${word}` : `day:${day}`
  const known = key in asked

  // ask the server, once per day and once per search. A search waits 350 ms after the last key.
  React.useEffect(() => {
    if (!shopId || fromToday || known) return
    const run = () =>
      void findBills(shopId, searching ? { q: word } : { day }).then((bills) =>
        setAsked((a) => ({
          ...a,
          [key]: bills ? bills.map((b) => b.id) : null,
        }))
      )
    if (!searching) return run()
    const t = window.setTimeout(run, 350)
    return () => window.clearTimeout(t)
  }, [shopId, fromToday, known, searching, word, day, key, findBills])

  // the bills themselves always come from the store (so an edit shows at once)
  const ids = asked[key]
  const list = fromToday
    ? invoices.filter((i) => dayKey(i.date) === today)
    : (ids ?? [])
        .map((id) => invoices.find((i) => i.id === id))
        .filter((i): i is Invoice => !!i)
  const loading = fromToday ? !analytics : !known
  const failed = known && ids === null

  const total = list.reduce((n, i) => n + invoiceTotal(i, stock), 0)

  // the last 7 days as buttons
  const week = Array.from({ length: 7 }, (_, n) => {
    const ms = now - n * 864e5
    return {
      key: dayKey(ms),
      label:
        n === 0
          ? "Today"
          : n === 1
            ? "Yesterday"
            : new Date(ms).toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
              }),
    }
  })
  const dayName = new Date(`${day}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return (
    <ListScreen
      title="Bills"
      count={searching ? "Find a bill" : dayName}
      controls={
        <>
          {/* the search and the calendar sit side by side, the same height */}
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <SearchBox
                value={q}
                onChange={setQ}
                placeholder="Bill number, customer or phone"
              />
            </div>
            <Popover open={calendar} onOpenChange={setCalendar}>
              <PopoverTrigger
                aria-label="Pick a date"
                className={cn(
                  "grid size-11 shrink-0 place-items-center rounded-full border transition-colors",
                  calendar
                    ? "border-foreground bg-foreground text-background"
                    : "border-foreground/15 bg-card hover:bg-foreground/6"
                )}
              >
                <CalendarDays className="size-5" />
              </PopoverTrigger>
              <PopoverContent align="end" className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={new Date(`${day}T00:00:00`)}
                  defaultMonth={new Date(`${day}T00:00:00`)}
                  onSelect={(d) => {
                    if (!d) return
                    setQ("") // picking a date leaves the search
                    setDay(dayKey(d.getTime()))
                    setCalendar(false)
                  }}
                  disabled={{ after: new Date(now) }}
                  className="[--cell-size:--spacing(9)] sm:[--cell-size:--spacing(10)]"
                />
              </PopoverContent>
            </Popover>
          </div>
          {!searching && (
            <div className="-mx-1 flex [scrollbar-width:none] gap-1.5 overflow-x-auto px-1 pb-0.5">
              {week.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setDay(d.key)}
                  aria-pressed={day === d.key}
                  className={cn(
                    "h-8 shrink-0 rounded-full border px-3 text-[13px] font-semibold transition-colors sm:h-9 sm:px-4 sm:text-sm",
                    day === d.key
                      ? "border-foreground bg-foreground text-background"
                      : "border-foreground/15 hover:bg-foreground/6"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}
        </>
      }
    >
      {/* the day (or the search): this stays still, only the bills below it scroll */}
      <div className="mt-2 rounded-2xl bg-foreground/6 px-3.5 py-3 sm:px-4 sm:py-3.5">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground">
              {searching ? `Matching “${q.trim()}”` : "Sales"}
            </p>
            <p className="text-2xl leading-tight font-extrabold tabular-nums sm:text-3xl">
              {inr(total)}
            </p>
          </div>
          <p className="shrink-0 pb-0.5 text-right text-xs text-muted-foreground">
            {list.length} {list.length === 1 ? "bill" : "bills"}
          </p>
        </div>
        {!searching && analytics && (
          <p className="mt-2 flex justify-between gap-2 border-t border-foreground/10 pt-2 text-xs text-muted-foreground">
            <span>
              Week{" "}
              <b className="text-foreground tabular-nums">
                {inr(analytics.week.total)}
              </b>
            </span>
            <span>
              Month{" "}
              <b className="text-foreground tabular-nums">
                {inr(analytics.month.total)}
              </b>
            </span>
          </p>
        )}
      </div>

      <div className="mt-1 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2">
        <ul>
          {list.map((i) => (
            <BillRow
              key={i.id}
              i={i}
              stock={stock}
              onOpen={() => setView(i.id)}
            />
          ))}
        </ul>
        {loading ? (
          <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" /> Loading…
          </p>
        ) : failed ? (
          <p className="py-8 text-center text-sm text-destructive">
            Could not load the bills. Check your connection.
          </p>
        ) : (
          list.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {searching ? "No bill matches that." : "No bills on this day."}
            </p>
          )
        )}
      </div>
      <InvoiceDrawer />
    </ListScreen>
  )
}
