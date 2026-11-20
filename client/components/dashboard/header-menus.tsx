"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Check, ChevronDown, LogOut, Moon, Pencil, Plus, Sun } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api } from "@/lib/proxy"
import { useShopStore } from "@/store/shop-store"
import { useUserStore } from "@/store/user-store"
import { cn } from "@/lib/utils"

/** The shop on screen. Opens its shops, rename, "Add new shop", and at the end the account (name, email, theme, log out). */
export function ShopMenu() {
  const router = useRouter()
  const { shops, shop, selectShop, setDialog, reset } = useShopStore()
  const user = useUserStore((s) => s.user)
  const setUser = useUserStore((s) => s.setUser)
  const { resolvedTheme, setTheme } = useTheme()
  const dark = resolvedTheme === "dark"

  const logOut = async () => {
    try {
      await api.post("/api/users/logout")
    } finally {
      setUser(null)
      reset()
      router.replace("/get-started")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-11 min-w-0 items-center gap-2.5 rounded-full pr-3 pl-1 transition-colors hover:bg-foreground/[0.06]">
        <span className="grid size-9 shrink-0 -rotate-6 place-items-center rounded-full bg-[#f7e33b] text-base font-extrabold text-[#10301f]">
          {shop?.name?.slice(0, 1).toUpperCase()}
        </span>
        <span className="truncate text-base font-bold">{shop?.name}</span>
        <ChevronDown className="size-4 shrink-0 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} className="min-w-60">
        <div role="group" aria-label="Your shops" className="grid gap-0.5">
          {shops.map((s) => (
            <DropdownMenuItem key={s.id} onClick={() => selectShop(s.id)} className="h-10 gap-2.5">
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full bg-[#f7e33b] text-xs font-extrabold text-[#10301f]",
                  s.id !== shop?.id && "opacity-60"
                )}
              >
                {s.name?.slice(0, 1).toUpperCase()}
              </span>
              <span className={cn("min-w-0 flex-1 truncate", s.id === shop?.id && "font-semibold")}>{s.name}</span>
              {s.id === shop?.id && <Check className="size-4" />}
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setDialog("edit")} className="h-9">
          <Pencil /> Edit shop
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setDialog("add")} className="h-9">
          <Plus /> Add new shop
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-sm">
          <p className="truncate font-semibold">{user?.name || "Your account"}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <DropdownMenuItem onClick={() => setTheme(dark ? "light" : "dark")} className="h-9">
          {dark ? <Sun /> : <Moon />} {dark ? "Light theme" : "Dark theme"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={logOut} className="h-9">
          <LogOut /> Log out
        </DropdownMenuItem>

      </DropdownMenuContent>
    </DropdownMenu>
  )
}
