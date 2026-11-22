import type { Metadata } from "next"

import { TermsPage } from "@/components/site/company/terms"

export const metadata: Metadata = {
  title: "Terms: BolBhai",
  description: "The terms of using BolBhai, printed as a bill.",
}

export default function Page() {
  return <TermsPage />
}
