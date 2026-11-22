"use client"

import * as React from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { AnimatePresence, motion } from "motion/react"
import { Check, Copy, Mail } from "lucide-react"

import {
  CompanyShell,
  Marker,
  Wrap,
  reduceMotion,
} from "@/components/site/company/shell"
import { CONTACT_EMAIL } from "@/lib/company"

const WE_DONT_HAVE = [
  "Chat bubble",
  "A chatbot",
  "Ticket number",
  "14-field form",
  "“Reply in 3-5 days”",
  "24/7 support (we sleep)",
]

export function ContactPage() {
  const root = React.useRef<HTMLDivElement>(null)
  const [copied, setCopied] = React.useState(false)

  // each thing we don't have gets struck out, one after another
  useGSAP(
    () => {
      if (reduceMotion()) return
      const q = gsap.utils.selector(root.current)
      const lines = q("[data-strike]")
      gsap.set(lines, { scaleX: 0, transformOrigin: "left center" })
      const list = root.current?.querySelector("[data-list]")
      if (!list) return
      const io = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return
          io.disconnect()
          gsap.to(lines, {
            scaleX: 1,
            duration: 0.45,
            stagger: 0.28,
            ease: "power2.inOut",
            delay: 0.3,
          })
        },
        { threshold: 0.5 }
      )
      io.observe(list)
      const failsafe = window.setTimeout(
        () => gsap.to(lines, { scaleX: 1 }),
        10000
      )
      return () => {
        io.disconnect()
        window.clearTimeout(failsafe)
      }
    },
    { scope: root }
  )

  async function copy() {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard blocked: the mail button still works
    }
  }

  return (
    <CompanyShell>
      <div ref={root}>
        <Wrap className="pt-5 sm:pt-12">
          <div data-hero>
            <p className="font-hand text-2xl text-signal sm:text-4xl">
              Contact
            </p>
            <h1 className="text-[clamp(2rem,8.5vw,4.4rem)] leading-[1] font-extrabold">
              Oh, you actually want to <Marker>talk</Marker> to us?
            </h1>
          </div>
        </Wrap>

        {/* what a contact page usually has, all crossed out */}
        <Wrap className="mt-7 sm:mt-12">
          <p data-rise className="text-sm text-foreground/60">
            Things we don’t have:
          </p>
          <ul data-list className="mt-2 flex flex-wrap gap-2">
            {WE_DONT_HAVE.map((t) => (
              <li
                key={t}
                className="relative rounded-full border border-foreground/15 px-3 py-1.5 text-sm text-foreground/75"
              >
                {t}
                <span
                  data-strike
                  aria-hidden="true"
                  className="absolute top-1/2 right-2 left-2 h-[2.5px] -translate-y-1/2 rounded bg-signal"
                />
              </li>
            ))}
          </ul>
        </Wrap>

        {/* the one thing we do have */}
        <Wrap className="mt-9 mb-14 sm:mt-14 sm:mb-24">
          <motion.div
            data-rise
            whileHover={{ rotate: 0, y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="relative mx-auto max-w-[560px] -rotate-1 rounded-[1.5rem] bg-[#fbf8ee] p-5 text-[#1d2a22] shadow-[0_24px_50px_-24px_rgb(0_0_0/0.6)] sm:p-8"
          >
            <div
              aria-hidden="true"
              className="absolute top-4 right-4 grid size-14 rotate-6 place-items-center rounded-[6px] border-[3px] border-dashed border-signal text-center font-hand text-base leading-[0.95] text-signal sm:size-[4.5rem] sm:text-xl"
            >
              real
              <br />
              mail
            </div>
            <p className="max-w-[12ch] font-hand text-[1.9rem] leading-[1.05] text-signal sm:max-w-none sm:text-4xl">
              If you really want to contact us
            </p>
            <p className="mt-2 text-[15px] text-[#1d2a22]/75">
              Mail us. A real person reads it, so be nice.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <motion.a
                href={`mailto:${CONTACT_EMAIL}`}
                whileTap={{ scale: 0.95 }}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-[#10301f] px-6 font-semibold text-[#f8f8f3]"
              >
                <Mail className="size-4" /> Write to us
              </motion.a>
              <motion.button
                type="button"
                onClick={copy}
                whileTap={{ scale: 0.95 }}
                className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-[#10301f] px-5 font-semibold"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={copied ? "done" : "copy"}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="grid place-items-center"
                  >
                    {copied ? (
                      <Check className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </motion.span>
                </AnimatePresence>
                {copied ? "Copied" : "Copy email"}
              </motion.button>
            </div>
          </motion.div>
        </Wrap>
      </div>
    </CompanyShell>
  )
}
