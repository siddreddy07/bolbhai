"use client"

import * as React from "react"
import Link from "next/link"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

import { Logo } from "@/components/site/doodles"
import { ShopMenu } from "@/components/dashboard/header-menus"
import { InvoiceDrawer } from "@/components/dashboard/bills/invoice-slip"
import { MicButton } from "@/components/dashboard/home-parts/mic-button"
import { QuickSheet } from "@/components/dashboard/home-parts/quick-sheet"
import { SalesSection } from "@/components/dashboard/home-parts/sales-section"
import { Tiles } from "@/components/dashboard/home-parts/tiles"
import { VoiceArea } from "@/components/dashboard/home-parts/voice-area"

/** The dashboard home. Each part lives in home-parts/; this file puts them together and plays the entrance. */
export function Home() {
  const root = React.useRef<HTMLElement>(null)

  // entrance: one orchestrated moment
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      const q = gsap.utils.selector(root.current)
      const html = document.documentElement
      const go = () =>
        gsap
          .timeline({ defaults: { ease: "power4.out" } })
          .from(q("[data-top]"), { y: -24, autoAlpha: 0, duration: 0.7 })
          .from(
            q("[data-hello]"),
            { y: 14, rotate: -6, autoAlpha: 0, duration: 0.7 },
            0.1
          )
          .from(
            q("[data-ch]"),
            { yPercent: 110, duration: 0.9, stagger: 0.05 },
            0.15
          )
          .from(q("[data-tabs]"), { y: 14, autoAlpha: 0, duration: 0.6 }, 0.2)
          .from(
            q("[data-tile]"),
            {
              y: 50,
              scale: 0.8,
              autoAlpha: 0,
              duration: 0.8,
              stagger: 0.09,
              ease: "back.out(1.8)",
            },
            0.35
          )
          .from(
            q("[data-micwrap]"),
            { scale: 0.4, autoAlpha: 0, duration: 0.9, ease: "back.out(2.2)" },
            0.6
          )
      if (html.classList.contains("loading") && !html.dataset.lifted) {
        gsap.set(
          q("[data-top],[data-hello],[data-tabs],[data-tile],[data-micwrap]"),
          { autoAlpha: 0 }
        )
        const start = () => {
          gsap.set(
            q("[data-top],[data-hello],[data-tabs],[data-tile],[data-micwrap]"),
            { clearProps: "visibility,opacity" }
          )
          go()
        }
        window.addEventListener("loader:lift", start, { once: true })
        const t = window.setTimeout(start, 6500)
        return () => {
          window.removeEventListener("loader:lift", start)
          window.clearTimeout(t)
        }
      }
      go()
    },
    { scope: root }
  )

  return (
    <main
      ref={root}
      className="relative mx-auto flex h-dvh max-w-[520px] flex-col overflow-hidden px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8 sm:pt-5 md:max-w-[720px] md:px-12 md:pt-8"
    >
      <div
        aria-hidden="true"
        className="halftone pointer-events-none absolute -top-10 -right-12 size-56 [mask-image:radial-gradient(circle,#000,transparent_70%)] text-foreground/10"
      />

      {/* top: the shop, and a tiny menu */}
      <header data-top className="relative flex items-center justify-between">
        <ShopMenu />
        <Link href="/" aria-label="BolBhai home" className="shrink-0 pl-2">
          <Logo className="[&_img]:h-9" />
        </Link>
      </header>

      <SalesSection />
      <Tiles />
      <VoiceArea />
      <MicButton />

      <InvoiceDrawer />
      <QuickSheet />
    </main>
  )
}
