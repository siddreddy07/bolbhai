"use client"

import * as React from "react"

import { AnchorScroll } from "@/components/site/anchor-scroll"
import { Footer } from "@/components/site/footer"
import { Hero } from "@/components/site/hero"
import { Navbar } from "@/components/site/navbar"
import { Reveal } from "@/components/site/reveal"
import { Cta, Faq, How, Jobs, Languages } from "@/components/site/sections"
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

  return (
    <>
      <Navbar />
      <Reveal />
      <AnchorScroll />
      <main id="main">
        <Hero />
        <Languages />
        <Jobs />
        <How />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </>
  )
}
