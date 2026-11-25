// Where the website lives, for links in search results and social previews.
// Set NEXT_PUBLIC_SITE_URL to the real address when you deploy (for example https://bolbhai.com).
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

export const SITE_NAME = "BolBhai"
export const SITE_TITLE = "BolBhai: don't type, bol de bhai"
export const SITE_DESCRIPTION =
  "Say the order in English and BolBhai writes the invoice. Stock, sales and khata (ledger) in one place for shopkeepers and wholesalers."

// the pages search engines may list (the dashboard and invoice pages are private)
export const PUBLIC_PAGES = [
  "/",
  "/about",
  "/contact",
  "/get-started",
  "/privacy",
  "/terms",
]
