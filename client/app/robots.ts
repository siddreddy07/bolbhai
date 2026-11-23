import type { MetadataRoute } from "next"

import { SITE_URL } from "@/lib/site"

// robots.txt: search engines may read the public pages, not the app itself.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/invoice"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
