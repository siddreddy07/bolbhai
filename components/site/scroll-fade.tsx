"use client"

import { useEffect } from "react"

/**
 * Scrollbars are invisible until something scrolls. This marks whatever is
 * scrolling with data-scrolling for a moment, and the CSS in globals.css
 * shows its thin thumb only while that mark is there.
 */
export function ScrollFade() {
  useEffect(() => {
    const timers = new WeakMap<Element, number>()
    const onScroll = (e: Event) => {
      const t = e.target
      const el = t instanceof Element ? t : document.documentElement
      el.setAttribute("data-scrolling", "")
      window.clearTimeout(timers.get(el))
      timers.set(el, window.setTimeout(() => el.removeAttribute("data-scrolling"), 800))
    }
    // scroll does not bubble, so listen in the capture phase to catch every scroller
    document.addEventListener("scroll", onScroll, { capture: true, passive: true })
    return () => document.removeEventListener("scroll", onScroll, { capture: true })
  }, [])
  return null
}
