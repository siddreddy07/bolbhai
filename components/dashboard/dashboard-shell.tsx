"use client"

import * as React from "react"

import { Onboarding } from "@/components/dashboard/onboarding"
import { useAuthorized } from "@/lib/shop-store"

/** Shop not set up yet -> onboarding. Otherwise the single home screen. */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const authorized = useAuthorized()
  return (
    <>
      <div aria-hidden="true" className="dash-bg" />
      {authorized ? children : <Onboarding />}
    </>
  )
}
