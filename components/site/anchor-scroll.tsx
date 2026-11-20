"use client"

import * as React from "react"

/**
 * One delegated click handler for every in-page link (href="#something").
 * It scrolls smoothly to the section and never touches the address bar, so the
 * URL stays clean: no #main, no #jobs. "#main" means the top of the page.
 */
export function AnchorScroll() {
  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element).closest?.("a[href^='#']") as HTMLAnchorElement | null
      if (!a) return
      const id = a.getAttribute("href")!.slice(1)
      e.preventDefault()
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      const behavior: ScrollBehavior = reduce ? "auto" : "smooth"
      if (!id || id === "main") {
        window.scrollTo({ top: 0, behavior })
        return
      }
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior, block: "start" })
    }
    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [])
  return null
}
