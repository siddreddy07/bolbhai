"use client"

import * as React from "react"

import { Home } from "@/components/dashboard/home"
import { api } from "@/lib/proxy"
import { useUserStore } from "@/store/user-store"

export default function Page() {
  const setUser = useUserStore((s) => s.setUser)

  // on every reload, get the logged-in user (if any) into the store
  React.useEffect(() => {
    api
      .get("/api/users/me")
      .then(({ data }) => {
        if (data?.id) setUser(data)
      })
      .catch(() => {})
  }, [setUser])

  return <Home />
}
