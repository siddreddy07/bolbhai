"use client"

import * as React from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ChevronRight } from "lucide-react"

import { InvoiceDrawer } from "@/components/dashboard/bills/invoice-slip"
import { Chips, ListScreen, SearchBox, Segmented, Sentinel, inr, useBatches } from "@/components/dashboard/list-kit"
import { useHomeStore } from "@/lib/home-store"
import type { Invoice } from "@/lib/types"
import { cn } from "@/lib/utils"

type Range = "today" | "week" | "month" | "year"
const RANGES: { id: Range; name: string; max: number }[] = [
  { id: "today", name: "Today", max: 1 },
  { id: "week", name: "Week", max: 7 },
  { id: "month", name: "Month", max: 30 },
  { id: "year", name: "Year", max: 365 },
]
type Status = "all" | "Paid" | "Khata"

export function dayLabel(d: number) {
  if (d === 0) return "Today"
  if (d === 1) return "Yesterday"
  return new Date(Date.now() - d * 864e5).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
}

/** One bill in a list. Tap it to see the invoice. */
export function BillRow({ i, onOpen }: { i: Invoice; onOpen: () => void }) {
  const khata = i.status === "Khata"
  return (
    <li data-line>
      <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 border-b border-foreground/10 py-3 text-left transition-colors active:bg-foreground/5">
        <span className="font-hand grid size-10 shrink-0 place-items-center rounded-full bg-foreground/[0.08] text-2xl leading-none">{i.who.slice(0, 1)}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold">{i.who}</span>
          <span className="block text-xs text-muted-foreground">#{i.id}</span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-0.5">
          <span className="font-bold tabular-nums">{inr(i.amount)}</span>
          <span className={cn("text-[11px] font-semibold", khata ? "text-signal" : "text-[#3fae6a]")}>{khata ? "on khata" : "paid"}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 opacity-40" />
      </button>
    </li>
  )
}

export function BillsPage() {
  const invoices = useHomeStore((s) => s.invoices)
  const setView = useHomeStore((s) => s.setViewInvoice)
  const [range, setRange] = React.useState<Range>("today")
  const [status, setStatus] = React.useState<Status>("all")
  const [q, setQ] = React.useState("")
  const root = React.useRef<HTMLDivElement>(null)

  const max = RANGES.find((r) => r.id === range)!.max
  const inRange = React.useMemo(() => invoices.filter((i) => i.daysAgo < max), [invoices, max])
  const total = inRange.reduce((a, i) => a + i.amount, 0)
  const khata = inRange.filter((i) => i.status === "Khata").reduce((a, i) => a + i.amount, 0)
  const needle = q.trim().toLowerCase()
  const list = React.useMemo(
    () => inRange.filter((i) => (status === "all" || i.status === status) && (!needle || i.who.toLowerCase().includes(needle) || String(i.id).includes(needle))),
    [inRange, status, needle]
  )
  const days = React.useMemo(() => {
    const m = new Map<number, { n: number; sum: number }>()
    list.forEach((i) => {
      const d = m.get(i.daysAgo) ?? { n: 0, sum: 0 }
      d.n++
      d.sum += i.amount
      m.set(i.daysAgo, d)
    })
    return m
  }, [list])
  const key = `${range}|${status}|${needle}`
  const { shown, more, sentinel } = useBatches(list, key, 40)

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      gsap.fromTo("[data-line]", { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35, stagger: { each: 0.015, amount: 0.3 }, ease: "power2.out", overwrite: true })
    },
    { dependencies: [key], scope: root }
  )

  const paidPct = total ? ((total - khata) / total) * 100 : 0

  return (
    <div ref={root}>
      <ListScreen
        title="All bills"
        count={`${list.length.toLocaleString("en-IN")} ${list.length === 1 ? "bill" : "bills"}${needle || status !== "all" ? " match" : ""}`}
        controls={
          <>
            <Segmented value={range} onChange={setRange} options={RANGES} label="Range" />
            <SearchBox value={q} onChange={setQ} placeholder="Search a name or bill number" />
            <Chips
              value={status}
              onChange={setStatus}
              options={[
                { id: "all", name: "All" },
                { id: "Paid", name: "Paid" },
                { id: "Khata", name: "On khata" },
              ]}
            />
          </>
        }
      >
        <div className="mt-3 flex items-end justify-between">
          <p className="text-3xl leading-none font-extrabold tabular-nums">{inr(total)}</p>
          <p className="text-xs text-muted-foreground">
            {inr(total - khata)} paid · {inr(khata)} khata
          </p>
        </div>
        <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-foreground/10" aria-hidden="true">
          <div className="bg-[#3fae6a]" style={{ width: `${paidPct}%` }} />
          <div className="bg-signal" style={{ width: `${100 - paidPct}%` }} />
        </div>

        <ul className="mt-1 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {shown.map((i, idx) => {
            const first = idx === 0 || shown[idx - 1].daysAgo !== i.daysAgo
            const d = days.get(i.daysAgo)
            return (
              <React.Fragment key={i.id}>
                {first && (
                  <li suppressHydrationWarning className="sticky top-0 z-10 flex justify-between bg-background/95 py-1.5 text-xs font-bold text-muted-foreground backdrop-blur">
                    <span>{dayLabel(i.daysAgo)}</span>
                    <span className="font-medium">
                      {d?.n} · {inr(d?.sum ?? 0)}
                    </span>
                  </li>
                )}
                <BillRow i={i} onOpen={() => setView(i.id)} />
              </React.Fragment>
            )
          })}
          <Sentinel more={more} innerRef={sentinel} left={list.length - shown.length} />
          {list.length === 0 && <li className="py-10 text-center text-sm text-muted-foreground">Nothing matches. Suspiciously quiet.</li>}
        </ul>
      </ListScreen>
      <InvoiceDrawer />
    </div>
  )
}
