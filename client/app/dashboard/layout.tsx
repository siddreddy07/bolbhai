import type { Metadata } from "next"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"

// the app itself is private: search engines should not list it
export const metadata: Metadata = {
  title: "Dashboard: BolBhai",
  robots: { index: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
