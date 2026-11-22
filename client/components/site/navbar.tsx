"use client"

import * as React from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import {
  Check,
  ChevronDown,
  ChevronRight,
  Globe,
  Moon,
  Sun,
} from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"

import { Logo } from "@/components/site/doodles"
import { LANGS, langClass, useLang } from "@/lib/lang"
import { cn } from "@/lib/utils"
import { useUserStore } from "@/store/user-store"

const LINKS = [
  { href: "#try", label: "Try it" },
  { href: "#jobs", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#faq", label: "FAQ" },
]

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const dark = mounted && resolvedTheme === "dark"
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "grid size-10 place-items-center rounded-full transition-colors hover:bg-foreground/10 active:scale-95",
        className
      )}
    >
      {dark ? (
        <Sun className="size-[18px]" />
      ) : (
        <Moon className="size-[18px]" />
      )}
    </button>
  )
}

/** One compact button; the three languages live in its menu. */
function LangMenu() {
  const { lang, setLang } = useLang()
  const [open, setOpen] = React.useState(false)
  const box = React.useRef<HTMLDivElement>(null)
  const current = LANGS.find((l) => l.id === lang)!

  React.useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("mousedown", onDown)
    window.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${current.name}`}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors hover:bg-foreground/10"
      >
        <Globe className="size-[18px]" />
        <span className={cn("min-w-5", langClass(lang))}>{current.short}</span>
        <ChevronDown
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Language"
          className="absolute top-12 right-0 w-44 overflow-hidden rounded-2xl border border-foreground/10 bg-card p-1.5 shadow-xl"
        >
          {LANGS.map((l) => (
            <li key={l.id} role="option" aria-selected={lang === l.id}>
              <button
                type="button"
                onClick={() => {
                  setLang(l.id)
                  setOpen(false)
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[15px] font-medium transition-colors hover:bg-foreground/[0.07]",
                  langClass(l.id)
                )}
              >
                {l.name}
                {lang === l.id && <Check className="size-4 text-signal" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Same choice as a row of three buttons, for the full-screen menu. */
function LangRow() {
  const { lang, setLang } = useLang()
  return (
    <div role="radiogroup" aria-label="Language" className="flex gap-2">
      {LANGS.map((l) => (
        <button
          key={l.id}
          role="radio"
          aria-checked={lang === l.id}
          onClick={() => setLang(l.id)}
          className={cn(
            "h-9 flex-1 rounded-full border text-[13px] font-semibold transition-colors",
            langClass(l.id),
            lang === l.id
              ? "border-foreground bg-foreground text-background"
              : "border-foreground/20"
          )}
        >
          {l.name}
        </button>
      ))}
    </div>
  )
}

export function Navbar() {
  const user = useUserStore((s) => s.user) // set once /api/users/me answers
  const [open, setOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)
  const root = React.useRef<HTMLDivElement>(null)
  const tl = React.useRef<gsap.core.Timeline | null>(null)

  // Passive scroll listener, one rAF per frame: the pill tightens a little once you scroll (it never hides)
  React.useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        const y = window.scrollY
        setScrolled(y > 24)
        raf = 0
      })
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  // One paused GSAP timeline: a full-width sheet opens under the bar, links
  // rise in turn, and the two lines of the icon turn into a clean X.
  useGSAP(
    () => {
      const q = gsap.utils.selector(root.current)
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
      // icon: two bars centred by margins; they start ±3.5px apart (the hamburger)
      gsap.set(q("[data-bar-a]"), { y: -3.5 })
      gsap.set(q("[data-bar-b]"), { y: 3.5 })
      const t = gsap.timeline({
        paused: true,
        defaults: { ease: "power3.out" },
      })
      // the sheet drops open from under the bar: full width, height from 0 to auto
      t.set(q("[data-menu]"), { autoAlpha: 1 }, 0)
        .fromTo(
          q("[data-menu]"),
          { height: 0, paddingTop: 0, paddingBottom: 0 },
          {
            height: "auto",
            paddingTop: 8,
            paddingBottom: 8,
            duration: 0.5,
            ease: "power4.out",
          },
          0
        )
        // ...and slide onto the centre while turning ±45°, so they cross exactly
        .to(
          q("[data-bar-a]"),
          { y: 0, rotation: 45, duration: 0.4, ease: "power3.inOut" },
          0
        )
        .to(
          q("[data-bar-b]"),
          { y: 0, rotation: -45, duration: 0.4, ease: "power3.inOut" },
          0
        )
        .fromTo(
          q("[data-link]"),
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.05 },
          0.12
        )
        .fromTo(
          q("[data-foot]"),
          { autoAlpha: 0, y: 10 },
          { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.06 },
          0.3
        )
      t.timeScale(reduce ? 40 : 1)
      tl.current = t
    },
    { scope: root }
  )

  React.useEffect(() => {
    const t = tl.current
    if (!t) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (open) t.timeScale(reduce ? 40 : 1).play()
    else t.timeScale(reduce ? 40 : 1.5).reverse()
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    const onDown = (e: PointerEvent) => {
      if (!(e.target as Element).closest("[data-menu],[data-menu-btn]"))
        setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onDown)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onDown)
    }
  }, [open])

  return (
    <div ref={root}>
      <a
        href="#main"
        className="fixed top-2 left-2 z-[70] -translate-y-16 rounded-full bg-foreground px-4 py-2 text-sm text-background focus:translate-y-0"
      >
        Skip to content
      </a>
      <header
        data-enter
        className="fixed inset-x-0 top-2 z-50 flex justify-center px-2.5 sm:top-3 sm:px-3"
      >
        <nav
          aria-label="Main"
          className={cn(
            "flex w-full items-center justify-between gap-3 rounded-full border border-foreground/10 bg-background/85 py-1 pr-1 pl-3.5 backdrop-blur-md transition-all duration-500 sm:pl-4 lg:gap-4 lg:py-1.5 lg:pr-1.5 lg:pl-5",
            scrolled
              ? "max-w-[860px] shadow-[0_10px_40px_-12px_rgb(16_48_31/0.35)]"
              : "max-w-[1000px] shadow-[0_6px_30px_-14px_rgb(16_48_31/0.25)]"
          )}
        >
          <a
            href="#main"
            aria-label="BolBhai home"
            className="-my-1.5 flex shrink-0 items-center sm:-my-2"
            onClick={() => setOpen(false)}
          >
            <Logo />
          </a>

          <ul className="hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="group relative block rounded-full px-4 py-2 text-[15px] font-medium whitespace-nowrap text-foreground/80 transition-colors hover:text-foreground"
                >
                  {l.label}
                  <span className="absolute inset-x-4 bottom-1 h-[2px] origin-left scale-x-0 rounded bg-signal transition-transform duration-300 group-hover:scale-x-100" />
                </a>
              </li>
            ))}
          </ul>

          <div className="flex shrink-0 items-center gap-1">
            <div className="hidden items-center gap-1 lg:flex">
              <LangMenu />
              <ThemeToggle />
            </div>
            <Link
              href={user ? "/dashboard" : "/get-started"}
              className="hidden h-9 items-center rounded-full bg-foreground px-4 text-sm font-semibold whitespace-nowrap text-background transition-all hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:scale-[.97] sm:inline-flex lg:h-11 lg:px-5 lg:text-[15px]"
            >
              {user ? "Go to shop" : "Start free"}
            </Link>
            <button
              type="button"
              data-menu-btn
              className="relative size-9 shrink-0 rounded-full bg-foreground text-background transition-transform active:scale-90 lg:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((o) => !o)}
            >
              <span
                data-bar-a
                className="absolute top-1/2 left-1/2 -mt-px -ml-[7.5px] h-[2px] w-[15px] rounded bg-current"
              />
              <span
                data-bar-b
                className="absolute top-1/2 left-1/2 -mt-px -ml-[7.5px] h-[2px] w-[15px] rounded bg-current"
              />
            </button>
          </div>
        </nav>
      </header>

      {/* Full-width sheet, at most half the screen tall, opened and closed by GSAP */}
      <div
        id="mobile-menu"
        data-menu
        inert={!open}
        className="invisible fixed inset-x-2.5 top-[3.4rem] z-40 max-h-[50svh] overflow-y-auto rounded-xl border border-foreground/10 bg-card px-2 opacity-0 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.55)] sm:inset-x-3 sm:top-[3.9rem] lg:hidden"
      >
        <ul>
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                data-link
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-base font-semibold transition-colors hover:bg-foreground/[0.07] active:bg-foreground/10"
              >
                {l.label}
                <ChevronRight className="size-4 opacity-40" />
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-1 flex flex-col gap-2 border-t border-foreground/10 px-1 pt-3 pb-1 sm:flex-row sm:items-center">
          <div data-foot className="sm:flex-1">
            <LangRow />
          </div>
          <div data-foot className="flex items-center gap-2">
            <Link
              href={user ? "/dashboard" : "/get-started"}
              onClick={() => setOpen(false)}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background sm:hidden"
            >
              {user ? "Go to shop" : "Start free"}
            </Link>
            <ThemeToggle className="size-10 shrink-0 border border-foreground/15" />
          </div>
        </div>
      </div>
    </div>
  )
}
