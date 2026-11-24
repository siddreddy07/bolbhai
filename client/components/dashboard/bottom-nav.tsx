"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { NotebookText, Package, ReceiptText } from "lucide-react"

const TABS = [
  { href: "/dashboard/bills", name: "Bills", Icon: ReceiptText },
  { href: "/dashboard/khata", name: "Khata", Icon: NotebookText },
  { href: "/dashboard/stock", name: "Stock", Icon: Package },
]

/** The bar at the bottom of Bills, Khata and Stock: it links to the OTHER two pages (you are already on this one). */
export function BottomNav() {
  const path = usePathname()
  const others = TABS.filter((t) => t.href !== path)

  return (
    <nav
      aria-label="Other pages"
      className="fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto grid h-14 w-[min(94vw,26rem)] grid-cols-2 rounded-full border border-foreground/10 bg-background/60 p-1 shadow-[0_10px_30px_-12px_rgb(16_48_31/0.4)] backdrop-blur-xl backdrop-saturate-150"
    >
      {others.map(({ href, name, Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors hover:bg-foreground/6 active:scale-95 active:bg-foreground/10"
        >
          <Icon className="size-[18px]" />
          {name}
        </Link>
      ))}
    </nav>
  )
}
