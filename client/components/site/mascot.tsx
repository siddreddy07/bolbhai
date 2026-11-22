"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * The BolBhai mascot. Drop your own files in `public/mascot/` and it plays:
 *
 *   bolbhai.webm   transparent loop for Chrome, Edge, Firefox, Android   (best)
 *   bolbhai.mov    transparent HEVC loop for Safari and iPhone           (optional)
 *   bolbhai.gif    used when no video can play                           (optional)
 *   bolbhai.png    a still, shown for people who prefer reduced motion   (optional)
 *
 * Whatever is missing is skipped. With no files at all the mascot simply is not shown, so the footer never has a hole in it.
 */
export function Mascot({
  className,
  name = "bolbhai",
  fallback = null,
  style,
}: {
  className?: string
  name?: string
  /** shown when there is no file to play */
  fallback?: React.ReactNode
  style?: React.CSSProperties
}) {
  const base = `/mascot/${name}`
  const [mode, setMode] = React.useState<"video" | "gif" | "still" | "none">(
    "video"
  )
  const [still, setStill] = React.useState(false)

  // people who asked for less motion get the still picture, not a loop
  React.useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)")
    const apply = () => setStill(q.matches)
    apply()
    q.addEventListener("change", apply)
    return () => q.removeEventListener("change", apply)
  }, [])

  const size = cn(
    "pointer-events-none h-auto w-32 select-none sm:w-40",
    className
  )

  if (mode === "none") return <>{fallback}</>
  if (still || mode === "still")
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`${base}.png`}
        alt="BolBhai, our mascot"
        className={size}
        style={style}
        onError={() => setMode("none")}
      />
    )
  if (mode === "gif")
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`${base}.gif`}
        alt="BolBhai, our mascot"
        className={size}
        style={style}
        onError={() => setMode("none")}
      />
    )
  return (
    <video
      className={size}
      style={style}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      poster={`${base}.png`}
      aria-label="BolBhai, our mascot"
    >
      <source src={`${base}.mov`} type='video/quicktime; codecs="hvc1"' />
      <source
        src={`${base}.webm`}
        type="video/webm"
        onError={() => setMode("gif")}
      />
    </video>
  )
}
