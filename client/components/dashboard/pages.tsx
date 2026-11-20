"use client"

import * as React from "react"
import { Check, ChevronRight } from "lucide-react"

import { Chips, ListScreen, PayForm, SearchBox, Sentinel, inr, useBatches } from "@/components/dashboard/list-kit"
import { useHomeStore } from "@/lib/home-store"
import { cn } from "@/lib/utils"

/* ================================================================== */
/* Khata: every customer, record payments by hand                      */
/* ================================================================== */

type KFilter = "owing" | "overdue" | "all"

export function KhataPage() {
  const customers = useHomeStore((s) => s.customers)
  const payDue = useHomeStore((s) => s.payDue)
  const [f, setF] = React.useState<KFilter>("owing")
  const [q, setQ] = React.useState("")
  const [openId, setOpenId] = React.useState<string | null>(null)
  const [thanks, setThanks] = React.useState<string | null>(null)

  const totalDue = customers.reduce((a, c) => a + c.due, 0)
  const needle = q.trim().toLowerCase()
  const list = React.useMemo(
    () =>
      customers
        .filter((c) => (f === "all" ? true : f === "owing" ? c.due > 0 : c.due > 0 && c.days >= 14))
        .filter((c) => !needle || c.name.toLowerCase().includes(needle))
        .sort((a, b) => b.due - a.due),
    [customers, f, needle]
  )
  const { shown, more, sentinel } = useBatches(list, `${f}|${needle}`)

  return (
    <ListScreen
      title="Khata"
      count={`${customers.filter((c) => c.due > 0).length} customers owe you`}
      controls={
        <>
          <SearchBox value={q} onChange={setQ} placeholder="Search a customer" />
          <Chips
            value={f}
            onChange={setF}
            options={[
              { id: "owing", name: "Owing" },
              { id: "overdue", name: "14+ days late" },
              { id: "all", name: "Everyone" },
            ]}
          />
        </>
      }
    >
      <div className="mt-3">
        <p className="text-xs text-muted-foreground">Total to collect</p>
        <p className="text-3xl leading-none font-extrabold tabular-nums">{inr(totalDue)}</p>
      </div>
      {thanks && (
        <p role="status" className="mt-2 flex items-center gap-2 rounded-xl bg-[#bfe8c4] px-3 py-2 text-sm font-semibold text-[#10301f]">
          <Check className="size-4 shrink-0" /> {thanks}
        </p>
      )}

      <ul className="mt-2 min-h-0 flex-1 divide-y divide-foreground/10 overflow-y-auto overscroll-contain pr-1 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {shown.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => {
                setThanks(null)
                if (c.due > 0) setOpenId(openId === c.id ? null : c.id)
              }}
              aria-expanded={openId === c.id}
              className="flex w-full items-center justify-between py-3 text-left"
            >
              <span className="min-w-0">
                <span className={cn("block truncate text-[15px] font-semibold", c.due === 0 && "line-through opacity-50")}>{c.name}</span>
                <span className="block text-xs text-muted-foreground">{c.due === 0 ? "Settled" : `${c.days} days overdue`}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                <span className="font-bold tabular-nums">{inr(c.due)}</span>
                {c.due > 0 && <ChevronRight className={cn("size-4 opacity-50 transition-transform", openId === c.id && "rotate-90")} />}
              </span>
            </button>
            {openId === c.id && (
              <PayForm
                due={c.due}
                onSave={(amt, mode) => {
                  payDue(c.id, amt)
                  setThanks(`${inr(amt)} from ${c.name} noted (${mode}). ${amt === c.due ? "All square." : "Rest still owed."}`)
                  setOpenId(null)
                }}
              />
            )}
          </li>
        ))}
        <Sentinel more={more} innerRef={sentinel} left={list.length - shown.length} />
        {list.length === 0 && <li className="py-10 text-center text-sm text-muted-foreground">No one here. Rare, and lovely.</li>}
      </ul>
    </ListScreen>
  )
}
