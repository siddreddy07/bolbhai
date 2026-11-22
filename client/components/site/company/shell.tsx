"use client"

import * as React from "react"
import Link from "next/link"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ArrowLeft } from "lucide-react"

import { Logo } from "@/components/site/doodles"
import { Footer } from "@/components/site/footer"
import { ThemeToggle } from "@/components/site/navbar"
import { cn } from "@/lib/utils"

/** Runs `run` once the loading screen has lifted (at once on a client-side navigation, when there is no loader). */
export function onLifted(run: () => void) {
  const html = document.documentElement
  if (html.dataset.lifted || !html.classList.contains("loading")) {
    run()
    return () => {}
  }
  window.addEventListener("loader:lift", run, { once: true })
  return () => window.removeEventListener("loader:lift", run)
}

export const reduceMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

/**
 * The frame every company page shares: a slim header (the mascot logo, a way home, the theme switch),
 * the page, and the site footer.
 *
 * Motion, in one place:
 *  - children of `[data-hero]` come up one after another once the loading screen is gone;
 *  - anything marked `[data-rise]` comes up the first time it scrolls into view.
 * Both are skipped with reduced motion, and nothing stays hidden if the observer never fires.
 */
export function CompanyShell({ children }: { children: React.ReactNode }) {
  const root = React.useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (reduceMotion()) return
      const q = gsap.utils.selector(root.current)
      const hero = q("[data-hero] > *")
      const rise = q("[data-rise]")
      gsap.set(hero, { y: 30, autoAlpha: 0 })
      gsap.set(rise, { y: 40, autoAlpha: 0 })

      const stop = onLifted(() =>
        gsap.to(hero, {
          y: 0,
          autoAlpha: 1,
          duration: 0.85,
          stagger: 0.1,
          ease: "power3.out",
          delay: 0.05,
        })
      )
      const io = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (!e.isIntersecting) return
            io.unobserve(e.target)
            gsap.to(e.target, {
              y: 0,
              autoAlpha: 1,
              duration: 0.9,
              ease: "power3.out",
            })
          }),
        { threshold: 0.12 }
      )
      rise.forEach((el) => io.observe(el))
      const failsafe = window.setTimeout(
        () => gsap.to([...hero, ...rise], { y: 0, autoAlpha: 1 }),
        9000
      )
      return () => {
        stop()
        io.disconnect()
        window.clearTimeout(failsafe)
      }
    },
    { scope: root }
  )

  return (
    <div ref={root}>
      <header className="mx-auto flex max-w-[1000px] items-center justify-between px-5 pt-4 sm:px-8 sm:pt-6">
        <Link href="/" aria-label="BolBhai home" className="shrink-0">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/"
            className="inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors hover:bg-foreground/10 active:scale-95"
          >
            <ArrowLeft className="size-4" /> Home
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main id="main">{children}</main>
      <Footer />
    </div>
  )
}

/** A yellow marker stroke behind a few words. */
export function Marker({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <mark
      className={cn(
        "rounded-[3px] bg-[var(--hl)] [box-decoration-break:clone] px-1.5 py-0.5 text-[#10301f]",
        className
      )}
    >
      {children}
    </mark>
  )
}

/** The width every company page keeps its text to. */
export function Wrap({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[1000px] px-5 sm:px-8", className)}
    >
      {children}
    </div>
  )
}
