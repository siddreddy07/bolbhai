"use client"

import * as React from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

import { inr } from "@/components/dashboard/list-kit"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer"
import { useHomeStore } from "@/lib/home-store"
import type { Invoice } from "@/lib/mock-data"
import { useShopStore } from "@/store/shop-store"

const POOL = ["Rice 25 kg", "Toor dal 1 kg", "Sugar 5 kg", "Sunflower oil 1 L", "Atta 10 kg", "Tea 500 g", "Salt 1 kg", "Biscuits 500 g", "Chilli powder 1 kg", "Soap 100 g", "Ghee 500 g", "Moong dal 1 kg"]

function rand(seed: number) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

/** Pretend line items that always add up to the bill's amount (mock). */
export function lineItems(inv: Invoice) {
  const n = inv.amount < 500 ? 1 + (inv.id % 2) : 2 + (inv.id % 3)
  const picks: string[] = []
  for (let k = 0; picks.length < n; k++) {
    const name = POOL[Math.floor(rand(inv.id * 7 + k) * POOL.length)]
    if (!picks.includes(name)) picks.push(name)
  }
  const w = picks.map((_, k) => 0.5 + rand(inv.id * 3 + k))
  const sum = w.reduce((a, b) => a + b, 0)
  let left = inv.amount
  return picks.map((name, k) => {
    const amount = k === picks.length - 1 ? left : Math.round((inv.amount * w[k]) / sum / 10) * 10
    left -= amount
    return { name, qty: 1 + Math.floor(rand(inv.id + k * 5) * 4), amount }
  })
}

function when(inv: Invoice) {
  const d = new Date(Date.now() - inv.daysAgo * 864e5)
  const day = inv.daysAgo === 0 ? "Today" : inv.daysAgo === 1 ? "Yesterday" : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
  const h = 9 + (inv.id % 11)
  const m = String((inv.id * 7) % 60).padStart(2, "0")
  return `${day} · ${h > 12 ? h - 12 : h}:${m} ${h >= 12 ? "pm" : "am"}`
}

function Slip({ inv, onClose }: { inv: Invoice; onClose: () => void }) {
  const shopName = useShopStore((s) => s.shop?.name) ?? "Your shop"
  const box = React.useRef<HTMLDivElement>(null)
  const khata = inv.status === "Khata"
  const items = React.useMemo(() => lineItems(inv), [inv])

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      const tl = gsap.timeline({ delay: 0.15 })
      tl.fromTo("[data-slip]", { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.7, ease: "steps(12)", clearProps: "clipPath" })
        .from("[data-li]", { y: -8, autoAlpha: 0, duration: 0.3, stagger: 0.07, ease: "power2.out" }, "-=0.35")
        .fromTo("[data-stamp]", { scale: 2.6, autoAlpha: 0, rotation: -26 }, { scale: 1, autoAlpha: 0.9, rotation: -12, duration: 0.4, ease: "back.out(2.2)" }, "-=0.05")
    },
    { scope: box }
  )

  return (
    <div ref={box} className="max-h-[86dvh] overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <DrawerTitle className="sr-only">Bill #{inv.id}</DrawerTitle>
      <DrawerDescription className="sr-only">
        {inv.who}, {inr(inv.amount)}, {khata ? "on khata" : "paid"}
      </DrawerDescription>

      <div data-slip className="mx-auto max-w-[420px] drop-shadow-[0_14px_24px_rgb(0_0_0/0.45)]">
        <div aria-hidden="true" className="zig-t paper h-3" />
        <div className="paper paper-grain relative px-5 pt-1 pb-5">
          <div className="text-center">
            <p className="font-hand text-3xl leading-none">{shopName}</p>
            <p className="mt-1 font-mono text-[11px] opacity-60">
              bill #{inv.id} · {when(inv)}
            </p>
          </div>

          <div className="mt-3 border-y border-dashed border-[#1d2a22]/35 py-2 font-mono text-[12px]">
            <span className="opacity-60">for </span>
            <span className="font-sans text-[15px] font-bold">{inv.who}</span>
          </div>

          <ul className="py-2">
            {items.map((l) => (
              <li key={l.name} data-li className="flex items-end gap-2 py-1.5 font-mono text-[13px]">
                <span className="font-sans text-[14px] leading-none font-semibold">
                  {l.name} <span className="font-mono text-[11px] font-normal opacity-60">× {l.qty}</span>
                </span>
                <span aria-hidden="true" className="leader mb-[3px] h-[3px] min-w-3 flex-1" />
                <span className="leading-none font-bold tabular-nums">{inr(l.amount)}</span>
              </li>
            ))}
          </ul>

          <div className="relative flex items-end justify-between border-t-2 border-dashed border-[#1d2a22]/45 pt-3">
            <span className="font-mono text-sm font-bold">total</span>
            <span className="font-mono text-4xl leading-none font-extrabold tracking-tight tabular-nums">{inr(inv.amount)}</span>
            <span
              data-stamp
              className="pointer-events-none absolute -top-7 left-[4%] rounded-[4px] border-[3px] bg-[#fbf8ee]/70 px-3 py-0.5 font-sans text-2xl font-black tracking-widest opacity-0 mix-blend-multiply"
              style={{ color: khata ? "#d8431f" : "#1f7a45", borderColor: khata ? "#d8431f" : "#1f7a45" }}
            >
              {khata ? "KHATA" : "PAID"}
            </span>
          </div>

          <p className="mt-4 text-center font-mono text-[11px] opacity-60">{khata ? "not paid yet · written in the khata" : "paid in full · thank you"}</p>
        </div>
        <div aria-hidden="true" className="zig-b paper h-3" />
      </div>

      <Button onClick={onClose} className="mx-auto mt-5 flex h-12 w-full max-w-[420px] rounded-full text-base">
        Done
      </Button>
    </div>
  )
}

/** One drawer for every screen: set `viewInvoice` in the store and this opens. */
export function InvoiceDrawer() {
  const id = useHomeStore((s) => s.viewInvoice)
  const invoices = useHomeStore((s) => s.invoices)
  const set = useHomeStore((s) => s.setViewInvoice)
  const inv = id === null ? null : (invoices.find((i) => i.id === id) ?? null)
  // keep the last bill on screen while the drawer slides away
  const [last, setLast] = React.useState<Invoice | null>(null)
  if (inv && inv !== last) setLast(inv)
  const shown = inv ?? last
  return (
    <Drawer open={!!inv} onOpenChange={(o) => !o && set(null)} showSwipeHandle>
      <DrawerContent className="mx-auto max-w-[520px]">{shown && <Slip key={shown.id} inv={shown} onClose={() => set(null)} />}</DrawerContent>
    </Drawer>
  )
}
