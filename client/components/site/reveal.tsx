"use client"

import * as React from "react"
import gsap from "gsap"

/**
 * One scroll-reveal for the whole page. Every [data-reveal] element fades up
 * once as it enters; ScrollTrigger.batch groups them so a row staggers instead
 * of firing a trigger per element. Only opacity and transform are animated,
 * so scrolling never triggers layout.
 */
export function Reveal() {
  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let dead = false
    let kill = () => {}
    const showAll = () =>
      gsap.set(document.querySelectorAll("[data-reveal]"), { opacity: 1, clearProps: "transform" })
    const failsafe = window.setTimeout(showAll, 5000)

    import("gsap/ScrollTrigger")
      .then(({ ScrollTrigger }) => {
        if (dead) return
        gsap.registerPlugin(ScrollTrigger)
        ScrollTrigger.config({ ignoreMobileResize: true })
        const made = ScrollTrigger.batch("[data-reveal]", {
          start: "top 92%",
          once: true,
          interval: 0.1,
          batchMax: 6,
          onEnter: (els) => {
            gsap.fromTo(
              els,
              { opacity: 0, y: 32 },
              {
                opacity: 1,
                y: 0,
                duration: 0.9,
                ease: "power3.out",
                stagger: 0.09,
                overwrite: true,
                clearProps: "transform",
              }
            )
          },
        })
        document.fonts?.ready.then(() => !dead && ScrollTrigger.refresh())
        kill = () => made.forEach((t) => t.kill())
        window.clearTimeout(failsafe)
      })
      .catch(showAll)

    return () => {
      dead = true
      window.clearTimeout(failsafe)
      kill()
    }
  }, [])
  return null
}
