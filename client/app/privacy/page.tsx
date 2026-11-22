import type { Metadata } from "next"

import { PrivacyPage } from "@/components/site/company/privacy"

export const metadata: Metadata = {
  title: "Privacy: BolBhai",
  description: "What BolBhai keeps, why, and who can see it.",
}

export default function Page() {
  return <PrivacyPage />
}
