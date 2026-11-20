"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { CreateShopDialog, EditShopDialog } from "@/components/dashboard/shop-dialogs"
import { api } from "@/lib/proxy"
import type { Shop } from "@/lib/shop"
import { useShopStore } from "@/store/shop-store"

/**
 * Loads the owner's shops. With none, the dashboard waits behind the set-up dialog
 * (which cannot be closed). The menus open the add and edit dialogs through the store.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { shop, loaded, dialog, setShops, setLoaded, setDialog } = useShopStore()

  React.useEffect(() => {
    api
      .get<Shop[]>("/api/shops")
      .then(({ data }) => setShops(data))
      .catch((error) => {
        if (error?.response?.status === 401) router.replace("/get-started")
      })
      .finally(() => setLoaded(true))
  }, [router, setShops, setLoaded])

  return (
    <>
      <div aria-hidden="true" className="dash-bg" />
      {children}
      {loaded && !shop && <CreateShopDialog first />}
      {dialog === "add" && <CreateShopDialog onClose={() => setDialog(null)} />}
      {dialog === "edit" && shop && <EditShopDialog shop={shop} onClose={() => setDialog(null)} />}
    </>
  )
}
