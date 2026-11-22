"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, Check, ChevronRight } from "lucide-react"

import { BillRow } from "@/components/dashboard/bills/bills-page"
import { PayForm, inr } from "@/components/dashboard/list-kit"
import { CatChip } from "@/components/dashboard/stock/kit"
import { daysAgo } from "@/lib/bill"
import { useHomeStore } from "@/lib/home-store"
import { cn } from "@/lib/utils"

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
  const setView = useHomeStore((s) => s.setViewInvoice)
  const setSheet = useHomeStore((s) => s.setSheet)
  const today = invoices.filter((i) => daysAgo(i.createdAt) === 0)
  const total = today.reduce((a, i) => a + i.amount, 0)
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
  const customers = useHomeStore((s) => s.customers)
  const payDue = useHomeStore((s) => s.payDue)
  const [openId, setOpenId] = React.useState<string | null>(null)
  const [thanks, setThanks] = React.useState<string | null>(null)

  const owing = customers.filter((c) => c.due > 0).sort((a, b) => b.due - a.due)
  const totalDue = owing.reduce((a, c) => a + c.due, 0)

  return (
    <div>
      <p className="text-xs text-muted-foreground">
        {owing.length} customers owe you
      </p>
      <p className="text-3xl leading-none font-extrabold tabular-nums">
        {inr(totalDue)}
      </p>
      {thanks && (
        <p
          role="status"
          className="mt-2 flex items-center gap-2 rounded-xl bg-[#bfe8c4] px-3 py-2 text-sm font-semibold text-[#10301f]"
        >
          <Check className="size-4 shrink-0" /> {thanks}
        </p>
      )}
      <ul className="mt-2 divide-y divide-foreground/10">
        {owing.slice(0, PREVIEW).map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => {
                setThanks(null)
                setOpenId(openId === c.id ? null : c.id)
              }}
              aria-expanded={openId === c.id}
              className="flex w-full items-center justify-between py-3 text-left"
            >
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-semibold">
                  {c.name}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {c.days} days overdue
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                <span className="font-bold tabular-nums">{inr(c.due)}</span>
                <ChevronRight
                  className={cn(
                    "size-4 opacity-50 transition-transform",
                    openId === c.id && "rotate-90"
                  )}
                />
              </span>
            </button>
            {openId === c.id && (
              <PayForm
                due={c.due}
                onSave={(amt, mode) => {
                  payDue(c.id, amt)
                  setThanks(
                    `${inr(amt)} from ${c.name} noted (${mode}). ${amt === c.due ? "All square." : "Rest still owed."}`
                  )
                  setOpenId(null)
                }}
              />
            )}
          </li>
        ))}
      </ul>
      <ViewAll
        href="/dashboard/khata"
        label={`View all customers (${customers.length})`}
      />
    </div>
  )
}

export function StockPanel() {
  const stock = useHomeStore((s) => s.stock)
  // two columns, so six fills the grid evenly
  const lowest = [...stock]
    .sort((a, b) => a.qty / a.max - b.qty / b.max)
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
              <p className="text-xs font-semibold text-signal">
                {i.qty === 0
                  ? "Out"
                  : `${i.qty} ${i.qty === 1 ? i.unit.replace(/s$/, "") : i.unit} left`}
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
