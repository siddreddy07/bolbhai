"use client"

import * as React from "react"
import Link from "next/link"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ArrowRight } from "lucide-react"

import {
  CompanyShell,
  Marker,
  Wrap,
  onLifted,
  reduceMotion,
} from "@/components/site/company/shell"
import { Mascot } from "@/components/site/mascot"
import Folder from "@/components/ui/folder"

const STEPS = [
  {
    n: "Say it",
    text: "Tap the mic and say the order. “Two kg sugar, one Surf Excel.”",
    bg: "#f7e33b",
  },
  {
    n: "Check it",
    text: "It finds the items on your shelf. Wrong one? Tap to change.",
    bg: "#bfe8c4",
  },
  {
    n: "Bill it",
    text: "Press Done. Saved as paid or not paid, cash or UPI.",
    bg: "#bfe0f5",
  },
  {
    n: "Done",
    text: "Stock goes down, khata updates, today's sales go up.",
    bg: "#ffd9c9",
  },
]

/** true while the viewport matches the media query (false on the server) */
function useQuery(query: string) {
  return React.useSyncExternalStore(
    (notify) => {
      const m = window.matchMedia(query)
      m.addEventListener("change", notify)
      return () => m.removeEventListener("change", notify)
    },
    () => window.matchMedia(query).matches,
    () => false
  )
}

export function AboutPage() {
  const stage = React.useRef<HTMLDivElement>(null)
  const wide = useQuery("(min-width: 1024px)")
  const mid = useQuery("(min-width: 700px)")
  // the folder works its colours out in the browser, so it is drawn only there
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  // after the loading screen the mascot pops in on his floor shadow, then the note is written in
  useGSAP(
    () => {
      if (reduceMotion()) return
      const q = gsap.utils.selector(stage.current)
      gsap.set(q("[data-pop]"), { autoAlpha: 0, scale: 0.7, y: 30 })
      gsap.set(q("[data-note]"), { clipPath: "inset(0 100% 0 0)" })
      return onLifted(() => {
        gsap
          .timeline({ delay: 0.15 })
          .to(q("[data-pop]"), {
            autoAlpha: 1,
            scale: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.12,
            ease: "back.out(1.8)",
          })
          .to(
            q("[data-note]"),
            {
              clipPath: "inset(0 0% 0 0)",
              duration: 0.8,
              ease: "power1.inOut",
            },
            "-=0.1"
          )
      })
    },
    { scope: stage }
  )

  return (
    <CompanyShell>
      <Wrap className="pt-5 sm:pt-12">
        <div
          ref={stage}
          className="grid grid-cols-[1fr_8.5rem] items-center gap-3 sm:grid-cols-[1fr_15rem] md:grid-cols-[1.2fr_1fr] md:gap-10"
        >
          <div data-hero>
            <p className="font-hand text-2xl text-signal sm:text-4xl">About</p>
            <h1 className="text-[clamp(2rem,8.5vw,4.4rem)] leading-[1] font-extrabold">
              Just <Marker>talk.</Marker> It writes the bill.
            </h1>
            <p className="mt-3 max-w-[44ch] text-[15px] leading-relaxed text-foreground/80 sm:mt-5 sm:text-lg">
              BolBhai listens to the order, makes the bill, cuts the stock and
              remembers who still has to pay you.
            </p>
          </div>

          <div className="relative mx-auto aspect-[4/5] w-full max-w-[400px]">
            <div
              data-pop
              aria-hidden="true"
              className="absolute inset-x-[14%] bottom-[1%] h-[5%] rounded-[50%] bg-black/50 blur-md"
            />
            <div
              data-pop
              className="absolute inset-0 flex items-end justify-center"
            >
              <Mascot className="h-40 w-auto max-w-none shrink-0 sm:h-60 sm:w-auto md:h-[22rem] md:w-auto" />
            </div>
            <p
              data-note
              className="absolute -bottom-2 left-0 -rotate-3 font-hand text-xl leading-none sm:text-3xl"
            >
              hi, I’m BolBhai
            </p>
          </div>
        </div>
      </Wrap>

      {/* the four steps live in a folder: tap it open, tap a page to read it */}
      <section className="mt-10 sm:mt-16">
        <Wrap>
          <h2 data-rise className="text-2xl font-extrabold sm:text-4xl">
            How a sale goes
          </h2>
          <p className="mt-1 font-hand text-xl text-foreground/70 sm:text-2xl">
            tap the folder
          </p>
        </Wrap>
        <div
          data-rise
          className="mx-auto mt-2 flex min-h-[26rem] max-w-[1000px] justify-center px-3 pt-24 pb-6 sm:min-h-[32rem] sm:pt-32"
        >
          {mounted && (
            <Folder
              label="4 steps"
              color="#f7e33b"
              paperColor="#fbf8ee"
              size={wide ? 1.6 : mid ? 1.2 : 1.25}
              layout={mid ? "spread" : "stack"}
              theme="dark"
              frost={0}
            >
              {STEPS.map((s, i) => (
                <div
                  key={s.n}
                  className="flex h-full flex-col gap-1.5 p-3.5 text-[#10301f]"
                  style={{ background: s.bg }}
                >
                  <p className="font-hand text-[22px] leading-none">
                    {i + 1}. {s.n}
                  </p>
                  <p className="text-[12.5px] leading-snug">{s.text}</p>
                </div>
              ))}
            </Folder>
          )}
        </div>
      </section>

      <Wrap className="mt-8 sm:mt-14">
        <p
          data-rise
          className="max-w-[56ch] text-[15px] text-foreground/70 sm:text-base"
        >
          English only for now. It can hear things wrong sometimes (“Surf”
          becomes “serve”), so check the slip before you press Done.
        </p>
      </Wrap>

      <Wrap className="mt-8 mb-14 sm:mt-12 sm:mb-24">
        <div
          data-rise
          className="flex flex-wrap items-center gap-3 rounded-[1.5rem] bg-[var(--hl)] p-5 text-[#10301f] sm:p-8"
        >
          <p className="mr-auto text-xl leading-tight font-extrabold sm:text-3xl">
            Say your next bill out loud.
          </p>
          <Link
            href="/get-started"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-[#10301f] px-5 text-[15px] font-semibold text-[#f8f8f3] transition-transform active:scale-95"
          >
            Try it free <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-11 items-center rounded-full border-2 border-[#10301f] px-4 text-[15px] font-semibold transition-transform active:scale-95"
          >
            Contact
          </Link>
        </div>
      </Wrap>
    </CompanyShell>
  )
}
