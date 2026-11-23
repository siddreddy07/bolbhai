// Where the website lives, for links in search results and social previews.
// Set NEXT_PUBLIC_SITE_URL to the real address when you deploy (for example https://bolbhai.com).
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

export const SITE_NAME = "BolBhai"
export const SITE_TITLE = "BolBhai: don't type, bol de bhai"
export const SITE_DESCRIPTION =
  "Speak in Telugu, Hindi or English. BolBhai updates stock, writes invoices and tracks customer credit for shopkeepers and wholesalers."

// the pages search engines may list (the dashboard and invoice pages are private)
export const PUBLIC_PAGES = [
  "/",
  "/about",
  "/contact",
  "/get-started",
  "/privacy",
  "/terms",
]
