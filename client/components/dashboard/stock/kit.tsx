"use client"

import { Apple, Droplets, Egg, Milk, Package, Soup, Wheat, Cookie, CupSoda, type LucideIcon } from "lucide-react"

import type { CatId, StockItem } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

/**
 * The shop's product categories. `group` is the exact value stored in products.category,
 * so the page can later filter the real catalog.
 */
export const CATS: { id: CatId; name: string; group: string; icon: LucideIcon; tone: string }[] = [
  { id: "cereals", name: "Cereals", group: "Cereals", icon: Wheat, tone: "#f7e33b" },
  { id: "dairy", name: "Dairy", group: "Dairy", icon: Milk, tone: "#cfe6f7" },
  { id: "drinks", name: "Drinks", group: "Drinks", icon: CupSoda, tone: "#bfe0f5" },
  { id: "snacks", name: "Snacks", group: "Snacks", icon: Cookie, tone: "#d9cdf5" },
  { id: "cooking", name: "Cooking", group: "Cooking", icon: Droplets, tone: "#ffd9a8" },
  { id: "fruits", name: "Fruit & veg", group: "Fruit & veg", icon: Apple, tone: "#bfe8c4" },
  { id: "meals", name: "Ready meals", group: "Ready meals", icon: Soup, tone: "#ffd0b8" },
  { id: "meat", name: "Meat & eggs", group: "Meat & eggs", icon: Egg, tone: "#f2d9cf" },
  { id: "other", name: "Other", group: "Other", icon: Package, tone: "#dcdcd4" },
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
