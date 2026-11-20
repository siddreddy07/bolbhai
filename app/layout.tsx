import type { Metadata, Viewport } from "next"
import {
  Bricolage_Grotesque,
  Caveat,
  Noto_Sans_Devanagari,
  Noto_Sans_Telugu,
} from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Loader } from "@/components/site/loader"
import { ScrollFade } from "@/components/site/scroll-fade"
import { LangProvider } from "@/lib/lang"
import { cn } from "@/lib/utils"

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["opsz", "wdth"],
  display: "swap",
})
const body = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
})
const hand = Caveat({
  subsets: ["latin"],
  variable: "--font-hand-src",
  display: "swap",
  weight: ["600"],
})
// Script faces only download when Telugu / Hindi text is on screen
const te = Noto_Sans_Telugu({
  subsets: ["telugu"],
  variable: "--font-te",
  display: "swap",
  preload: false,
})
const hi = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-hi",
  display: "swap",
  preload: false,
})

export const metadata: Metadata = {
  title: "BolBhai: don't type, bol de bhai",
  description:
    "Speak in Telugu, Hindi or English. BolBhai updates stock, writes invoices and tracks customer credit for shopkeepers and wholesalers.",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f8f3" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0c0b" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        display.variable,
        body.variable,
        hand.variable,
        te.variable,
        hi.variable
      )}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "var d=document.documentElement;d.classList.add('js');if(!matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('loading')",
          }}
        />
      </head>
      <body>
        <Loader />
        <ScrollFade />
        <ThemeProvider>
          <LangProvider>{children}</LangProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
