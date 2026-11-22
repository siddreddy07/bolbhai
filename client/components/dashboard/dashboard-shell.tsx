"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import {
  CreateShopDialog,
  EditShopDialog,
} from "@/components/dashboard/shop-dialogs"
import { Toaster } from "@/components/ui/sonner"
import { syncStock, useHomeStore } from "@/store/home-store"
import { api } from "@/lib/proxy"
import type { Shop } from "@/lib/shop"
import { useShopStore } from "@/store/shop-store"

/**
 * Loads the owner's shops. With none, the dashboard waits behind the set-up dialog
 * (which cannot be closed). The menus open the add and edit dialogs through the store.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { shop, loaded, dialog, setShops, setLoaded, setDialog } =
    useShopStore()

  const shopId = shop?.id
  const loadStock = useHomeStore((s) => s.loadStock)
  const loadBills = useHomeStore((s) => s.loadBills)
  const loadAnalytics = useHomeStore((s) => s.loadAnalytics)
  React.useEffect(() => {
    if (shopId) {
      loadStock(shopId) // the saved inventory: the order slip and the bills read from it
      loadBills(shopId)
      loadAnalytics(shopId) // today, this week and this month: one request
    }
  }, [shopId, loadStock, loadBills, loadAnalytics])

  // stock counts (changed by bills too) are saved when the tab is hidden or closed, on any dashboard page
  React.useEffect(() => {
    const hidden = () =>
      document.visibilityState === "hidden" && void syncStock()
    const closing = () => void syncStock()
    document.addEventListener("visibilitychange", hidden)
    window.addEventListener("pagehide", closing)
    return () => {
      document.removeEventListener("visibilitychange", hidden)
      window.removeEventListener("pagehide", closing)
    }
  }, [])

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
      <Toaster />
      {loaded && !shop && <CreateShopDialog first />}
      {dialog === "add" && <CreateShopDialog onClose={() => setDialog(null)} />}
      {dialog === "edit" && shop && (
        <EditShopDialog shop={shop} onClose={() => setDialog(null)} />
      )}
    </>
  )
}
