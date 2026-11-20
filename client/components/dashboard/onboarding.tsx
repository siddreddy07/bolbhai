"use client"

import * as React from "react"
import { ArrowRight, Check, LoaderCircle } from "lucide-react"

import { useShopStore } from "@/lib/shop-store"
import { Logo } from "@/components/site/doodles"
import { ThemeToggle } from "@/components/site/navbar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GSTIN_RE, MOCK_USER } from "@/lib/shop"
import { cn } from "@/lib/utils"

const TYPES = ["Kirana", "Wholesale", "Medical", "Other"]

const STEPS_GST = ["Reading your GSTIN", "Asking the GST portal nicely", "Counting your digits (there are 15)"]
const STEPS_NO_GST = ["Reading your shop name", "Taking your word for it, for now", "Setting up your ledger"]

/**
 * Shown when the shop has no name / GSTIN yet. "Check my shop" fakes the
 * verification, then authorizes the shop so the dashboard opens.
 */
export function Onboarding() {
  const authorize = useShopStore((s) => s.authorize)
  const [name, setName] = React.useState("")
  const [type, setType] = React.useState("Kirana")
  const [city, setCity] = React.useState("")
  const [pincode, setPincode] = React.useState("")
  const [gstin, setGstin] = React.useState("")
  const [noGst, setNoGst] = React.useState(false)
  const [errs, setErrs] = React.useState<Record<string, string>>({})
  const [step, setStep] = React.useState(-1) // -1 idle, 0..n checking, n done
  const steps = noGst ? STEPS_NO_GST : STEPS_GST
  const checking = step >= 0
  const done = step >= steps.length

  const check = (e: React.FormEvent) => {
    e.preventDefault()
    const g = gstin.trim().toUpperCase()
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = "Your shop needs a name. “The Shop” is taken."
    if (!city.trim()) next.city = "Which city? Roughly."
    if (!/^\d{6}$/.test(pincode)) next.pincode = "Six digits. Yes, all of them."
    if (!noGst && !GSTIN_RE.test(g)) next.gstin = "That doesn’t look like a GSTIN. It’s 15 characters, like 36ABCDE1234F1Z5."
    setErrs(next)
    if (Object.keys(next).length) return
    setStep(0)
  }

  // walk the fake verification steps
  React.useEffect(() => {
    if (step < 0 || step >= steps.length) return
    const t = window.setTimeout(() => setStep((s) => s + 1), 750)
    return () => window.clearTimeout(t)
  }, [step, steps.length])

  const open = () =>
    authorize({ name: name.trim(), type, city: city.trim(), pincode, gstin: noGst ? "" : gstin.trim().toUpperCase() })

  return (
    <div className="grid min-h-dvh place-items-center bg-[var(--stage)] p-3 sm:p-6">
      <div aria-hidden="true" className="grain pointer-events-none fixed inset-0" />
      <div className="relative w-full max-w-[520px] rounded-[1.5rem] border border-foreground/10 bg-card p-4 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.5)] sm:rounded-[2rem] sm:p-7">
        <div className="mb-4 flex items-center justify-between sm:mb-5">
          <Logo />
          <ThemeToggle />
        </div>

        <h1 className="text-[1.45rem] leading-tight font-extrabold sm:text-3xl">
          One more thing, {MOCK_USER.name}.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          What do we call your shop? And yes, the taxman will ask for a GSTIN.
        </p>

        {!checking ? (
          <form onSubmit={check} noValidate className="mt-4 grid gap-3 sm:mt-5 sm:gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="shop">Shop name</Label>
              <Input
                id="shop"
                value={name}
                placeholder="Sri Lakshmi Traders"
                aria-invalid={!!errs.name}
                onChange={(e) => setName(e.target.value)}
                className="h-10"
              />
              {errs.name && <p role="alert" className="text-[13px] font-medium text-signal">{errs.name}</p>}
            </div>

            <div className="grid gap-1.5">
              <Label>What kind of shop</Label>
              <div role="radiogroup" aria-label="Shop type" className="flex flex-wrap gap-1.5">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={type === t}
                    onClick={() => setType(t)}
                    className={cn(
                      "h-8 rounded-full border px-3.5 text-sm font-medium transition-colors",
                      type === t ? "border-foreground bg-foreground text-background" : "border-foreground/20 hover:bg-foreground/[0.06]"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-[1fr_7.5rem] gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={city} placeholder="Hyderabad" aria-invalid={!!errs.city} onChange={(e) => setCity(e.target.value)} className="h-10" />
                {errs.city && <p role="alert" className="text-[13px] font-medium text-signal">{errs.city}</p>}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pin">Pincode</Label>
                <Input
                  id="pin"
                  inputMode="numeric"
                  value={pincode}
                  placeholder="500001"
                  aria-invalid={!!errs.pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-10"
                />
              </div>
            </div>
            {errs.pincode && <p role="alert" className="-mt-2 text-[13px] font-medium text-signal">{errs.pincode}</p>}

            <div className="grid gap-1.5">
              <Label htmlFor="gst">GSTIN</Label>
              <Input
                id="gst"
                value={gstin}
                disabled={noGst}
                placeholder={noGst ? "Skipped. We’ll nag you later." : "36ABCDE1234F1Z5"}
                aria-invalid={!!errs.gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15))}
                className="h-10 font-mono tracking-wider uppercase"
              />
              {errs.gstin && <p role="alert" className="text-[13px] font-medium text-signal">{errs.gstin}</p>}
              <label className="mt-1 flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox checked={noGst} onCheckedChange={(v) => setNoGst(!!v)} />
                I don’t have a GSTIN yet
              </label>
            </div>

            <Button type="submit" size="lg" className="mt-1 h-11 w-full rounded-full text-base">
              Check my shop <ArrowRight className="size-4" />
            </Button>
          </form>
        ) : (
          <div className="mt-5 grid gap-3" aria-live="polite">
            <ul className="grid gap-2.5">
              {steps.map((s, i) => (
                <li key={s} className={cn("flex items-center gap-3 text-sm transition-opacity sm:text-base", i > step ? "opacity-30" : "opacity-100")}>
                  <span className={cn("grid size-6 shrink-0 place-items-center rounded-full", i < step ? "bg-[#3fae6a] text-white" : "border border-foreground/25")}>
                    {i < step ? <Check className="size-3.5" /> : i === step ? <LoaderCircle className="size-3.5 animate-spin" /> : null}
                  </span>
                  {s}
                </li>
              ))}
            </ul>
            {done && (
              <div className="mt-2 rounded-2xl bg-[#bfe8c4] p-4 text-[#10301f]">
                <p className="text-lg font-extrabold">{name.trim()} is authorized.</p>
                <p className="mt-0.5 text-sm opacity-80">
                  {noGst ? "Provisional, until you add a GSTIN." : "GSTIN checked. The taxman is mildly impressed."}
                </p>
                <Button onClick={open} size="lg" className="mt-3 h-11 w-full rounded-full text-base">
                  Open my dashboard <ArrowRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        )}
        <p className="mt-4 text-center text-xs text-muted-foreground">Frontend preview: nothing is actually verified.</p>
      </div>
    </div>
  )
}
