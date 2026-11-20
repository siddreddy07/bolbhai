import type { Metadata } from "next"

import { GetStarted } from "@/components/site/get-started"

export const metadata: Metadata = {
  title: "Get started: BolBhai",
  description: "Make a BolBhai account, or log back in. Your shop's typing is about to become someone else's problem.",
}

export default function Page() {
  return <GetStarted />
}
