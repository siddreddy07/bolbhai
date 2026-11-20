import { cn } from "@/lib/utils"

/**
 * An illustration with a light and a dark version (see /public/illustrations/CREDITS.md).
 * The wrapper takes the size, position and breakpoint classes; the two images inside only
 * switch with the theme, so the two never clash. Static, decorative, hidden from screen readers.
 */
export function Illo({ name, className }: { name: "groceries" | "voice-assistant" | "happy-customer"; className?: string }) {
  /* eslint-disable @next/next/no-img-element */
  return (
    <span aria-hidden="true" className={cn("pointer-events-none select-none", className)}>
      <img src={`/illustrations/${name}.light.svg`} alt="" decoding="async" draggable={false} className="block size-full dark:hidden" />
      <img src={`/illustrations/${name}.dark.svg`} alt="" decoding="async" draggable={false} className="hidden size-full dark:block" />
    </span>
  )
}
