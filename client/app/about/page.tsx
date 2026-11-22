import type { Metadata } from "next"

import { AboutPage } from "@/components/site/company/about"

export const metadata: Metadata = {
  title: "About: BolBhai",
  description:
    "BolBhai is a voice assistant that writes your bills, moves your stock and keeps your khata. English for now.",
}

export default function Page() {
  return <AboutPage />
}
