"use client"

import * as React from "react"

export type Lang = "en" | "te" | "hi"

export const LANGS: { id: Lang; short: string; name: string }[] = [
  { id: "en", short: "EN", name: "English" },
  { id: "te", short: "తె", name: "తెలుగు" },
  { id: "hi", short: "हि", name: "हिन्दी" },
]

/** The one demo scenario, spoken in each language. Mock data only. */
export const SPOKEN: Record<Lang, string> = {
  en: "Ramesh took 5 bags of rice. Make his bill.",
  te: "రమేష్‌కి 5 బస్తాల బియ్యం బిల్లు వేయి.",
  hi: "रमेश को 5 बोरी चावल का बिल बनाओ।",
}

export const LISTENING: Record<Lang, string> = {
  en: "Listening…",
  te: "వింటున్నాను…",
  hi: "सुन रहा हूँ…",
}

/** The brand name never changes with the language. */
export const BRAND = "BolBhai"

/** The tagline, two lines, in street-casual Telugu and Hindi (not formal). */
export const TAGLINE: Record<Lang, [string, string]> = {
  en: ["Don’t type.", "Bol de, bhai."],
  te: ["టైప్ చేయకు.", "బోల్ దే, భాయ్."],
  hi: ["टाइप मत कर।", "बोल दे, भाई।"],
}

/** Split into user-perceived characters so Telugu / Devanagari clusters stay whole. */
export function graphemes(s: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" })
    return Array.from(seg.segment(s), (x) => x.segment)
  }
  return Array.from(s)
}

/** What the shopkeeper says on each job card, in each language (casual, spoken). */
export const JOB_SAY: Record<string, Record<Lang, string>> = {
  stock: { en: "20 bags of rice came in", te: "20 బస్తాల బియ్యం వచ్చాయి", hi: "चावल की 20 बोरी आई है" },
  purchases: { en: "bought 30 bags of sugar", te: "30 బస్తాల పంచదార కొన్నా", hi: "30 बोरी चीनी खरीदी" },
  bills: { en: "make a bill for Ramesh", te: "రమేష్‌కి బిల్లు వేయి", hi: "रमेश का बिल बना दो" },
  khata: { en: "Ramesh paid two thousand", te: "రమేష్ రెండు వేలు ఇచ్చాడు", hi: "रमेश ने दो हज़ार दिए" },
  reports: { en: "show me today's sales", te: "ఈ రోజు అమ్మకాలు చూపించు", hi: "आज की बिक्री दिखाओ" },
  ask: { en: "how much rice is left?", te: "బియ్యం ఎంత మిగిలింది?", hi: "चावल कितना बचा है?" },
}

export const langClass = (l: Lang) =>
  l === "te" ? "font-te" : l === "hi" ? "font-hi" : ""

type Ctx = { lang: Lang; setLang: (l: Lang) => void }
const LangContext = React.createContext<Ctx>({ lang: "en", setLang: () => {} })

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>("en")
  const setLang = React.useCallback((l: Lang) => setLangState(l), [])
  const value = React.useMemo(() => ({ lang, setLang }), [lang, setLang])
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export const useLang = () => React.useContext(LangContext)
