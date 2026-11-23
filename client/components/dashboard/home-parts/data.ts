import { BookUser, Boxes, ReceiptText, type LucideIcon } from "lucide-react"

import type { Period, SheetKey } from "@/store/home-store"

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN")

// What the chart shows before the server's numbers arrive: empty bars.
export const zeros = (n: number) => Array.from({ length: n }, () => 0)
export const SERIES: Record<
  Period,
  {
    label: string
    total: number
    bills: number
    delta: string
    up: boolean
    vs: string
    bars: number[]
    names: string[]
  }
> = {
  day: {
    label: "today",
    total: 0,
    bills: 0,
    delta: "0%",
    up: true,
    vs: "yesterday",
    bars: zeros(12),
    names: [
      "8 am",
      "9 am",
      "10 am",
      "11 am",
      "12 pm",
      "1 pm",
      "2 pm",
      "3 pm",
      "4 pm",
      "5 pm",
      "6 pm",
      "7 pm",
    ],
  },
  week: {
    label: "this week",
    total: 0,
    bills: 0,
    delta: "0%",
    up: true,
    vs: "last week",
    bars: zeros(7),
    names: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
  month: {
    label: "this month",
    total: 0,
    bills: 0,
    delta: "0%",
    up: true,
    vs: "last month",
    bars: zeros(30),
    names: Array.from({ length: 30 }, (_, i) => `${i + 1}`),
  },
}
export const PERIODS: { id: Period; name: string }[] = [
  { id: "day", name: "Today" },
  { id: "week", name: "Week" },
  { id: "month", name: "Month" },
]

export const TILES: {
  key: Exclude<SheetKey, null>
  label: string
  icon: LucideIcon
  note: string
  tone: string
  tilt: string
}[] = [
  {
    key: "bills",
    label: "Bills",
    icon: ReceiptText,
    note: "",
    tone: "bg-[#f7e33b]",
    tilt: "-rotate-2",
  },
  {
    key: "stock",
    label: "Stock",
    icon: Boxes,
    note: "",
    tone: "bg-[#bfe8c4]",
    tilt: "rotate-1",
  },
  {
    key: "khata",
    label: "Khata",
    icon: BookUser,
    note: "",
    tone: "bg-[#bfe0f5]",
    tilt: "-rotate-1",
  },
]

export const SHEETS: Record<
  Exclude<SheetKey, null>,
  { title: string; hint: string }
> = {
  bills: {
    title: "All bills",
    hint: "Every invoice. Or just say “make a bill for…”.",
  },
  stock: {
    title: "Running low",
    hint: "Say “20 bags of rice came in” to update.",
  },
  khata: {
    title: "Who owes you",
    hint: "Tap a name when they pay. Or say “Ramesh paid two thousand”.",
  },
}
