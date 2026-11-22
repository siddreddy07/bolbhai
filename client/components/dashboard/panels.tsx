"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, ChevronRight } from "lucide-react"

import { BillRow } from "@/components/dashboard/bills/bills-page"
import { inr } from "@/components/dashboard/list-kit"
import { CatChip } from "@/components/dashboard/stock/kit"
import { daysAgo, invoiceTotal } from "@/lib/bill"
import { useHomeStore, useKhata } from "@/store/home-store"

/**
 * The drawer only ever shows a handful (the latest 5). Anything more lives on
 * its own full page behind the "View all" button, so hundreds of rows never
 * end up inside a drawer.
 */
const PREVIEW = 5

function ViewAll({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mt-3 flex h-12 items-center justify-center gap-2 rounded-full bg-foreground text-base font-semibold text-background transition-transform active:scale-[.97]"
    >
      {label} <ArrowRight className="size-5" />
    </Link>
  )
}

export function BillsPanel() {
  const invoices = useHomeStore((s) => s.invoices)
  const stock = useHomeStore((s) => s.stock)
  const setView = useHomeStore((s) => s.setViewInvoice)
  const setSheet = useHomeStore((s) => s.setSheet)
  const today = invoices.filter((i) => daysAgo(i.date) === 0)
  const total = today.reduce((a, i) => a + invoiceTotal(i, stock), 0)
  return (
    <div>
      <p className="text-xs text-muted-foreground">
        {today.length} bills today
      </p>
      <p className="text-3xl leading-none font-extrabold tabular-nums">
        {inr(total)}
      </p>
      <ul className="mt-1">
        {invoices.slice(0, PREVIEW).map((i) => (
          <BillRow
            key={i.id}
            i={i}
            stock={stock}
            onOpen={() => {
              // swap the drawer for the invoice
              setSheet(null)
              setView(i.id)
            }}
          />
        ))}
      </ul>
      <ViewAll
        href="/dashboard/bills"
        label={`View all bills (${invoices.length.toLocaleString("en-IN")})`}
      />
    </div>
  )
}

export function KhataPanel() {
  const { bills, count, totalDue } = useKhata()
  const setView = useHomeStore((s) => s.setViewInvoice)

  return (
    <div>
      <p className="text-xs text-muted-foreground">
        {count} unpaid {count === 1 ? "bill" : "bills"}
      </p>
      <p className="text-3xl leading-none font-extrabold tabular-nums">
        {inr(totalDue)}
      </p>
      <ul className="mt-2 divide-y divide-foreground/10">
        {bills.slice(0, PREVIEW).map((b) => {
          const days = daysAgo(b.date)
          return (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => setView(b.id)}
                className="flex w-full items-center justify-between gap-3 py-3 text-left"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold">
                    {b.items.map((l) => l.name).join(", ")}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {days === 0
                      ? "today"
                      : days === 1
                        ? "yesterday"
                        : `${days} days ago`}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <span className="font-bold tabular-nums">{inr(b.total)}</span>
                  <ChevronRight className="size-4 opacity-50" />
                </span>
              </button>
            </li>
          )
        })}
        {bills.length === 0 && (
          <li className="py-6 text-center text-sm text-muted-foreground">
            No unpaid bills. Everyone has paid.
          </li>
        )}
      </ul>
      <ViewAll
        href="/dashboard/khata"
        label={`View all unpaid bills (${count})`}
      />
    </div>
  )
}

export function StockPanel() {
  const stock = useHomeStore((s) => s.stock)
  // two columns, so six fills the grid evenly
  const lowest = [...stock]
    .sort((a, b) => a.qty - b.qty)
    .slice(0, 6)
  return (
    <div>
      <ul className="grid grid-cols-2 gap-2">
        {lowest.map((i) => (
          <li
            key={i.id}
            className="flex items-center gap-2.5 rounded-2xl bg-foreground/[0.06] p-2.5"
          >
            <CatChip category={i.category} className="size-10" />
            <div className="min-w-0">
              <p className="truncate text-sm leading-tight font-bold">
                {i.name}
              </p>
              <p
                className={`text-xs font-semibold ${i.qty < 5 ? "text-red-500" : "text-foreground/60"}`}
              >
                {i.qty === 0
                  ? "Out"
                  : i.qty < 5
                    ? `Out soon · ${i.qty} left`
                    : `${i.qty} ${i.unit} left`}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <ViewAll
        href="/dashboard/stock"
        label={`View all stock (${stock.length})`}
      />
    </div>
  )
}
