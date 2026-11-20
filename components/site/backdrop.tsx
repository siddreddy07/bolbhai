import { Illo } from "@/components/site/illo"

/**
 * Hero backdrop: plain and still. The sky colour, a low torn mint hill to stand on, and two
 * illustrations (a customer with shop shelves, someone speaking to a phone) that tuck in
 * behind the app preview at the bottom corners. No circles, no scripts, no motion.
 */
export function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg className="absolute inset-0 size-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="torn" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="7" />
            <feDisplacementMap in="SourceGraphic" scale="22" />
          </filter>
        </defs>
        <g filter="url(#torn)">
          <path d="M-60 770C180 720 380 748 620 730s520-40 780 14 120 60 120 60V960H-60Z" fill="var(--stage-2)" />
        </g>
      </svg>

      <div className="grain absolute inset-0" />

      {/* the two figures: wide screens only, so they never crowd the content */}
      <Illo name="groceries" className="absolute bottom-0 left-[1%] hidden aspect-[662/646] w-[18rem] -scale-x-100 xl:block 2xl:left-[5%] 2xl:w-[21rem]" />
      <Illo name="voice-assistant" className="absolute right-[1%] bottom-0 hidden aspect-[821/715] w-[19rem] xl:block 2xl:right-[4%] 2xl:w-[22rem]" />
    </div>
  )
}
