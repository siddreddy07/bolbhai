"use client"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { SHEETS } from "@/components/dashboard/home-parts/data"
import {
  BillsPanel,
  KhataPanel,
  StockPanel,
} from "@/components/dashboard/panels"
import { useHomeStore } from "@/store/home-store"

/** The small sheet that slides up when a sticky note is tapped. Drag it down or tap outside to close. */
export function QuickSheet() {
  const sheet = useHomeStore((s) => s.sheet)
  const setSheet = useHomeStore((s) => s.setSheet)
  const open = sheet ? SHEETS[sheet] : null
  return (
    <Drawer
      open={!!sheet}
      onOpenChange={(o) => !o && setSheet(null)}
      showSwipeHandle
    >
      <DrawerContent className="mx-auto max-w-[520px] md:max-w-[720px]">
        {open && (
          <div className="px-5 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <DrawerHeader className="p-0 pb-2 text-left">
              <DrawerTitle className="font-hand text-4xl leading-none font-semibold">
                {open.title}
              </DrawerTitle>
              <DrawerDescription>{open.hint}</DrawerDescription>
            </DrawerHeader>
            {sheet === "bills" && <BillsPanel />}
            {sheet === "khata" && <KhataPanel />}
            {sheet === "stock" && <StockPanel />}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}
