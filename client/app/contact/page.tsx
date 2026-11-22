import type { Metadata } from "next"

import { ContactPage } from "@/components/site/company/contact"

export const metadata: Metadata = {
  title: "Contact: BolBhai",
  description: "One email address, and a person who reads it.",
}

export default function Page() {
  return <ContactPage />
}
