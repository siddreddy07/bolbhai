"use client"

import * as React from "react"
import Link from "next/link"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ArrowLeft, ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react"

import { Logo, Sparkle, Squiggle } from "@/components/site/doodles"
import { ThemeToggle } from "@/components/site/navbar"
import { TAGLINE, langClass, useLang } from "@/lib/lang"
import { cn } from "@/lib/utils"

type Mode = "up" | "in"
type Field = "name" | "shop" | "phone" | "pw" | null

const WEAK = /^(123456|1234567|12345678|password|qwerty|iloveyou|000000|111111|abc123)/i

/** 0..4, with a heckle for each. */
function rate(pw: string) {
  if (!pw) return { score: 0, say: "Type something. Anything. Except “password”." }
  if (WEAK.test(pw)) return { score: 1, say: "Bold. Hackers send their thanks." }
  let s = 0
  if (pw.length >= 6) s++
  if (pw.length >= 9) s++
  if (/\d/.test(pw) && /[a-zA-Z]/.test(pw)) s++
  if (/[^a-zA-Z0-9]/.test(pw) || pw.length >= 13) s++
  const say = [
    "Your nephew would guess that in two tries.",
    "Short. Like a Sunday shift.",
    "Getting there. Add a number, a symbol, some attitude.",
    "Respectable. Your cousin will still try your birthday.",
    "Fort Knox called. They want tips.",
  ][s]
  return { score: s, say }
}

const IDLE: Record<Mode, string> = {
  up: "Hi, I’m BolBhai. From now on, I do the typing. You do the talking.",
  in: "Back already? The rice didn’t count itself.",
}
const FOCUS: Record<Mode, Record<"name" | "shop" | "phone", string>> = {
  up: {
    name: "Your name first. We’re not animals.",
    shop: "Shop name. “Sri Lakshmi Traders” is taken. By everyone.",
    phone: "Ten digits. We won’t call at 2 a.m. Your suppliers will.",
  },
  in: {
    name: "",
    shop: "",
    phone: "Same number as last time. Not your ex’s.",
  },
}

function Input({
  label,
  hint,
  error,
  className,
  ...p
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 flex items-baseline justify-between text-[13px] font-semibold sm:mb-1.5 sm:text-sm md:text-[15px]">
        {label}
        {hint && <span className="font-normal opacity-55">{hint}</span>}
      </span>
      <input
        {...p}
        aria-invalid={!!error}
        className={cn(
          "h-11 w-full rounded-xl border md:h-12 md:text-lg lg:text-base bg-background px-3.5 text-base outline-none transition-[border-color,box-shadow] placeholder:text-foreground/35 focus:border-foreground focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--hl)_55%,transparent)]",
          error ? "border-signal" : "border-foreground/20"
        )}
      />
      {error && (
        <span role="alert" className="mt-1.5 block text-[13px] font-medium text-signal">
          {error}
        </span>
      )}
    </label>
  )
}

export function GetStarted() {
  const { lang } = useLang()
  const [mode, setMode] = React.useState<Mode>("up")
  const [name, setName] = React.useState("")
  const [shop, setShop] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [pw, setPw] = React.useState("")
  const [show, setShow] = React.useState(false)
  const [focus, setFocus] = React.useState<Field>(null)
  const [errs, setErrs] = React.useState<Record<string, string>>({})
  const [status, setStatus] = React.useState<"idle" | "busy" | "done">("idle")

  const root = React.useRef<HTMLDivElement>(null)
  const firstMode = React.useRef(true)
  const rating = rate(pw)
  const first = name.trim().split(" ")[0]

  // what the bubble says right now
  const fromFocus =
    focus === "pw"
      ? mode === "up"
        ? rating.say
        : "Forgot it? Take a breath. Then take the link."
      : focus
        ? FOCUS[mode][focus]
        : ""
  const say =
    Object.values(errs)[0] ||
    fromFocus ||
    (mode === "up" && first ? `Nice to meet you, ${first}. Try not to make it weird.` : IDLE[mode])

  // entrance (waits for the loading screen if it is still up)
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      const q = gsap.utils.selector(root.current)
      const run = () =>
        gsap
          .timeline({ defaults: { ease: "power4.out" } })
          .from(q("[data-in]"), { y: 28, autoAlpha: 0, duration: 0.8, stagger: 0.08 })
          .from(q("[data-float]"), { scale: 0, rotate: -20, duration: 0.7, stagger: 0.1, ease: "back.out(2.4)" }, 0.3)
      const html = document.documentElement
      if (html.classList.contains("loading") && !html.dataset.lifted) {
        gsap.set(q("[data-in],[data-float]"), { autoAlpha: 0 })
        const go = () => {
          gsap.set(q("[data-in],[data-float]"), { clearProps: "visibility,opacity" })
          run()
        }
        window.addEventListener("loader:lift", go, { once: true })
        const t = window.setTimeout(go, 6500)
        return () => {
          window.removeEventListener("loader:lift", go)
          window.clearTimeout(t)
        }
      }
      run()
    },
    { scope: root }
  )

  // sign up shows two extra fields; log in folds them away
  useGSAP(
    () => {
      const q = gsap.utils.selector(root.current)
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      const dur = firstMode.current || reduce ? 0 : 0.5
      firstMode.current = false
      const open = mode === "up"
      q("[data-su]").forEach((el) => el.toggleAttribute("inert", !open))
      gsap.to(q("[data-su]"), {
        height: open ? "auto" : 0,
        autoAlpha: open ? 1 : 0,
        duration: dur,
        ease: "power3.inOut",
        overwrite: true,
      })
      gsap.to(q("[data-pill]"), { xPercent: open ? 0 : 100, duration: dur, ease: "power3.inOut" })
    },
    { dependencies: [mode, status], scope: root }
  )

  // the bubble re-types itself when the line changes
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      const q = gsap.utils.selector(root.current)
      gsap.fromTo(q("[data-say]"), { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35, ease: "power2.out", overwrite: true })
    },
    { dependencies: [say], scope: root }
  )

  // success pop
  useGSAP(
    () => {
      if (status !== "done") return
      const q = gsap.utils.selector(root.current)
      gsap.fromTo(q("[data-done]"), { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.1, ease: "power3.out" })
      gsap.fromTo(q("[data-stamp]"), { scale: 2.2, rotate: -24, autoAlpha: 0 }, { scale: 1, rotate: -8, autoAlpha: 1, duration: 0.5, delay: 0.35, ease: "back.out(2)" })
    },
    { dependencies: [status], scope: root }
  )

  const shake = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    gsap.fromTo("[data-card]", { x: -8 }, { x: 0, duration: 0.5, ease: "elastic.out(1.2, 0.25)" })
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const digits = phone.replace(/\D/g, "")
    const next: Record<string, string> = {}
    if (mode === "up" && !name.trim()) next.name = "We need something to call you. “Boss” is taken."
    if (digits.length !== 10) next.phone = `That’s ${digits.length} digit${digits.length === 1 ? "" : "s"}. India has 10.`
    if (pw.length < 6) next.pw = "Six characters minimum. Your ATM PIN doesn’t count."
    setErrs(next)
    if (Object.keys(next).length) {
      shake()
      return
    }
    setStatus("busy")
    // Frontend only for now: pretend the server thought about it.
    window.setTimeout(() => setStatus("done"), 1100)
  }

  const switchMode = (m: Mode) => {
    setErrs({})
    setMode(m)
  }

  const err = (k: string) => errs[k]

  return (
    <div ref={root} className="min-h-svh p-1.5 sm:p-3">
      <div className="mx-auto grid h-[calc(100dvh-0.75rem)] max-w-[1280px] grid-rows-[auto_1fr] overflow-hidden rounded-[1.25rem] border border-foreground/10 sm:h-[calc(100dvh-1.5rem)] sm:rounded-[2rem] lg:h-auto lg:min-h-[calc(100svh-1.5rem)] lg:grid-cols-[1.05fr_1fr] lg:grid-rows-1">
        {/* the quirky half */}
        <section className="relative grid content-start gap-2.5 overflow-hidden bg-[var(--stage)] px-3.5 pt-3 pb-3 sm:px-6 sm:pt-5 sm:pb-5 md:grid-cols-2 md:items-end md:gap-x-8 md:gap-y-4 md:pt-6 md:pb-6 lg:flex lg:flex-col lg:items-stretch lg:justify-between lg:p-10">
          <div aria-hidden="true" className="halftone pointer-events-none absolute -right-10 -bottom-10 size-72 text-foreground/10 [mask-image:radial-gradient(circle,#000,transparent_70%)]" />
          <div aria-hidden="true" className="grain pointer-events-none absolute inset-0" />
          <Sparkle data-float className="absolute top-24 right-10 hidden size-7 text-signal lg:block" />
          <Squiggle data-float className="absolute right-12 bottom-24 hidden w-32 text-foreground/25 lg:block" />

          <div data-in className="relative flex items-center justify-between md:col-span-2 lg:col-span-1">
            <Link href="/" aria-label="BolBhai home">
              <Logo />
            </Link>
            <ThemeToggle className="lg:hidden" />
          </div>

          <div className="relative lg:my-0">
            <h1
              data-in
              className="max-w-[18ch] text-[1.3rem] leading-[1.05] font-extrabold [@media(max-height:700px)]:text-[1.2rem] sm:text-[1.7rem] md:max-w-[14ch] md:text-[2.1rem] lg:text-[clamp(2.6rem,4.4vw,4rem)]"
              style={{ fontVariationSettings: '"wdth" 92' }}
            >
              <span className="lg:hidden">{mode === "up" ? "Sign up. Or don’t." : "Welcome back."}</span>
              <span className="hidden lg:inline">{mode === "up" ? "Sign up. Or don’t. The rice stays uncounted." : "Welcome back. We kept your khata warm."}</span>
            </h1>
            <p data-in className="mt-2 hidden max-w-[40ch] text-sm leading-snug text-foreground/70 sm:block sm:text-base lg:mt-3">
              {mode === "up"
                ? "Forty seconds, start to finish. We timed it. Slowly, to be fair."
                : "Log in and pick up where your last bill left off."}
            </p>
          </div>

          {/* the bubble that reacts to you */}
          <div data-in className="relative flex items-end gap-2.5 sm:gap-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--hl)] text-[#10301f] sm:size-11 lg:size-12">
              <svg viewBox="0 0 32 32" className="size-6" aria-hidden="true">
                <path d="M10.5 12v4M14 9.5v9M17.5 11v6M21 13v2" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
              </svg>
            </div>
            <div className="relative min-h-[2.5rem] flex-1 rounded-2xl rounded-bl-sm bg-card px-3 py-1.5 text-[13px] leading-snug font-semibold shadow-[0_14px_34px_-18px_rgb(0_0_0/0.5)] sm:min-h-[3.5rem] sm:px-4 sm:py-3 sm:text-base lg:max-w-[420px]">
              <p data-say role="status">
                {say}
              </p>
            </div>
          </div>

          <p data-in className={cn("relative mt-5 hidden text-sm font-semibold text-foreground/55 lg:block", langClass(lang))}>
            {TAGLINE[lang].join(" ")}
          </p>
        </section>

        {/* the form half */}
        <section className="relative flex min-h-0 flex-col overflow-y-auto bg-background px-4 pt-3 pb-4 sm:px-8 sm:py-8 lg:overflow-visible lg:p-10">
          <div data-in className="hidden items-center justify-between lg:flex">
            <Link
              href="/"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-foreground/70 transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" /> Back to home
            </Link>
            <ThemeToggle />
          </div>

          <div data-card className="mx-auto my-auto w-full max-w-[430px] sm:max-w-[520px] sm:my-auto md:max-w-[560px] lg:m-auto lg:max-w-[430px] lg:py-8">
            {status === "done" ? (
              <div className="relative text-center">
                <div data-done className="relative mx-auto mb-5 w-fit">
                  <div className="grid size-20 place-items-center rounded-full bg-[var(--mint)] text-[#10301f]">
                    <Logo className="[&_span]:hidden [&_svg]:size-10" />
                  </div>
                  <span
                    data-stamp
                    className="absolute -right-12 -bottom-1 rounded-md border-[3px] border-signal px-2 py-0.5 text-sm font-extrabold tracking-wide text-signal"
                  >
                    {mode === "up" ? "REGISTERED" : "LOGGED IN"}
                  </span>
                </div>
                <h2 data-done className="text-2xl font-extrabold sm:text-3xl">
                  {mode === "up" ? `You’re in${first ? `, ${first}` : ""}.` : "Welcome back."}
                </h2>
                <p data-done className="mx-auto mt-2 max-w-[34ch] text-sm leading-snug text-foreground/70 sm:text-base">
                  Your dashboard is ready. Practise saying “bill banao” on the way in.
                </p>
                <div data-done className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
                  <Link
                    href="/dashboard"
                    className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-base font-semibold text-background transition-all hover:-translate-y-px hover:shadow-lg active:scale-[.97]"
                  >
                    Open my dashboard
                  </Link>
                </div>
                <p data-done className="mt-4 text-xs opacity-50">
                  Frontend preview: nothing was actually saved.
                </p>
              </div>
            ) : (
              <>
                {/* mode switch */}
                <div data-in role="radiogroup" aria-label="Sign up or log in" className="relative mb-3 grid grid-cols-2 rounded-full bg-foreground/[0.07] p-1 sm:mb-5 lg:mb-6">
                  <span data-pill aria-hidden="true" className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-foreground" />
                  {(["up", "in"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="radio"
                      aria-checked={mode === m}
                      onClick={() => switchMode(m)}
                      className={cn(
                        "relative h-10 rounded-full text-sm font-semibold transition-colors sm:text-[15px]",
                        mode === m ? "text-background" : "text-foreground/70 hover:text-foreground"
                      )}
                    >
                      {m === "up" ? "Sign up" : "Log in"}
                    </button>
                  ))}
                </div>

                <form data-in onSubmit={submit} noValidate>
                  <div data-su className="grid overflow-hidden sm:grid-cols-2 sm:gap-x-3">
                    <Input
                      label="Your name"
                      name="name"
                      autoComplete="name"
                      placeholder="Ramesh Kumar"
                      value={name}
                      error={err("name")}
                      onChange={(e) => setName(e.target.value)}
                      onFocus={() => setFocus("name")}
                      onBlur={() => setFocus(null)}
                      className="p-1 pb-2.5 sm:pb-3 md:pb-4"
                    />
                    <Input
                      label="Shop name"
                      hint="optional"
                      name="shop"
                      autoComplete="organization"
                      placeholder="Sri Lakshmi Traders"
                      value={shop}
                      onChange={(e) => setShop(e.target.value)}
                      onFocus={() => setFocus("shop")}
                      onBlur={() => setFocus(null)}
                      className="p-1 pb-2.5 max-sm:[@media(max-height:700px)]:hidden sm:pb-3 md:pb-4"
                    />
                  </div>

                  <label className="mb-2.5 block p-1 pb-0 sm:mb-3 md:mb-4">
                    <span className="mb-1.5 block text-[13px] font-semibold sm:text-sm">Phone number</span>
                    <span className="flex">
                      <span className="grid h-11 place-items-center rounded-l-xl md:h-12 md:text-lg lg:text-base border border-r-0 border-foreground/20 bg-foreground/[0.05] px-3 text-sm font-semibold">
                        +91
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        placeholder="98765 43210"
                        value={phone}
                        aria-invalid={!!err("phone")}
                        onChange={(e) => setPhone(e.target.value.replace(/[^\d ]/g, "").slice(0, 11))}
                        onFocus={() => setFocus("phone")}
                        onBlur={() => setFocus(null)}
                        className={cn(
                          "h-11 w-full min-w-0 rounded-r-xl border md:h-12 md:text-lg lg:text-base bg-background px-3.5 text-base outline-none transition-[border-color,box-shadow] placeholder:text-foreground/35 focus:border-foreground focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--hl)_55%,transparent)]",
                          err("phone") ? "border-signal" : "border-foreground/20"
                        )}
                      />
                    </span>
                    {err("phone") && (
                      <span role="alert" className="mt-1.5 block text-[13px] font-medium text-signal">
                        {err("phone")}
                      </span>
                    )}
                  </label>

                  <div className="p-1">
                    <label className="block">
                      <span className="mb-1.5 flex items-baseline justify-between text-[13px] font-semibold sm:text-sm">
                        Password
                        {mode === "in" && <span className="font-normal opacity-60">Forgot it? Say “forgot”. Kidding.</span>}
                      </span>
                      <span className="relative block">
                        <input
                          type={show ? "text" : "password"}
                          autoComplete={mode === "up" ? "new-password" : "current-password"}
                          placeholder={mode === "up" ? "Make it hard to guess" : "Your password"}
                          value={pw}
                          aria-invalid={!!err("pw")}
                          onChange={(e) => setPw(e.target.value)}
                          onFocus={() => setFocus("pw")}
                          onBlur={() => setFocus(null)}
                          className={cn(
                            "h-11 w-full rounded-xl border md:h-12 md:text-lg lg:text-base bg-background pr-12 pl-3.5 text-base outline-none transition-[border-color,box-shadow] placeholder:text-foreground/35 focus:border-foreground focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--hl)_55%,transparent)]",
                            err("pw") ? "border-signal" : "border-foreground/20"
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShow((s) => !s)}
                          aria-label={show ? "Hide password" : "Show password"}
                          className="absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 place-items-center rounded-full text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground"
                        >
                          {show ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                        </button>
                      </span>
                    </label>
                    {err("pw") && (
                      <span role="alert" className="mt-1.5 block text-[13px] font-medium text-signal">
                        {err("pw")}
                      </span>
                    )}
                    {mode === "up" && (
                      <div aria-hidden="true" className="mt-2 grid grid-cols-4 gap-1.5">
                        {[1, 2, 3, 4].map((i) => (
                          <span
                            key={i}
                            className={cn(
                              "h-1.5 rounded-full transition-colors duration-300",
                              i <= rating.score
                                ? rating.score >= 3
                                  ? "bg-[#3fae6a]"
                                  : rating.score === 2
                                    ? "bg-[var(--hl)]"
                                    : "bg-signal"
                                : "bg-foreground/15"
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={status === "busy"}
                    className="group mt-4 inline-flex h-11 w-full sm:mt-5 sm:h-12 md:mt-6 md:h-14 md:text-lg items-center justify-center gap-2 rounded-full bg-foreground text-base font-semibold text-background transition-all hover:-translate-y-px hover:shadow-xl active:translate-y-0 active:scale-[.98] disabled:opacity-80 lg:h-14 lg:text-lg"
                  >
                    {status === "busy" ? (
                      <>
                        <LoaderCircle className="size-5 animate-spin" /> Doing it…
                      </>
                    ) : (
                      <>
                        {mode === "up" ? "Make my account" : "Log me in"}
                        <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                </form>

                <p data-in className="mt-3 text-center text-xs leading-relaxed text-foreground/55 sm:mt-4 sm:text-[13px]">
                  {mode === "up" ? (
                    <>
                      By signing up you agree that we’ll be useful. Already here?{" "}
                      <button type="button" onClick={() => switchMode("in")} className="font-semibold text-foreground underline decoration-signal underline-offset-4">
                        Log in
                      </button>
                    </>
                  ) : (
                    <>
                      New here? Your future self says thanks.{" "}
                      <button type="button" onClick={() => switchMode("up")} className="font-semibold text-foreground underline decoration-signal underline-offset-4">
                        Sign up
                      </button>
                    </>
                  )}
                </p>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
