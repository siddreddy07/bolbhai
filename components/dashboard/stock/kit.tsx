"use client"

import { Bean, Candy, Coffee, Cookie, Droplets, Flame, SprayCan, Wheat, type LucideIcon } from "lucide-react"

import type { CatId, StockItem } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export const CATS: { id: CatId; name: string; icon: LucideIcon; tone: string }[] = [
  { id: "grains", name: "Rice & grains", icon: Wheat, tone: "#f7e33b" },
  { id: "pulses", name: "Pulses", icon: Bean, tone: "#bfe8c4" },
  { id: "oils", name: "Oils & ghee", icon: Droplets, tone: "#bfe0f5" },
  { id: "sugar", name: "Sugar & salt", icon: Candy, tone: "#f9c9d9" },
  { id: "spices", name: "Spices", icon: Flame, tone: "#ffd0b8" },
  { id: "tea", name: "Tea & coffee", icon: Coffee, tone: "#eadfc4" },
  { id: "snacks", name: "Snacks", icon: Cookie, tone: "#d9cdf5" },
  { id: "home", name: "Household", icon: SprayCan, tone: "#cfe3d4" },
]
export const CAT = Object.fromEntries(CATS.map((c) => [c.id, c])) as Record<CatId, (typeof CATS)[number]>
export const UNITS = ["bags", "kg", "L", "packs", "pcs", "boxes", "tins"]

export const isLow = (i: Pick<StockItem, "qty" | "max">) => i.qty / i.max < 0.2
export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN")

/** Small coloured chip with the category icon (no pictures). */
export function CatChip({ category, className }: { category: CatId; className?: string }) {
  const cat = CAT[category]
  return (
    <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl text-[#10301f]", className)} style={{ background: cat.tone }} title={cat.name}>
      <cat.icon className="size-5" />
    </span>
  )
}
