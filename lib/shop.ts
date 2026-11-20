/**
 * Frontend-only switch for the dashboard gate.
 *
 *   false -> the visitor must set up the shop first (name, GSTIN...) and hit "Check my shop"
 *   true  -> straight into the dashboard
 *
 * Flip it to preview each UI. Replace with real auth/shop data when the backend arrives.
 */
export const SHOP_AUTHORIZED = true

/** Mock signed-in user (until real auth). */
export const MOCK_USER = { name: "Siddharth", phone: "98765 43210" }

/** Mock shop used when SHOP_AUTHORIZED is true. */
export const MOCK_SHOP = {
  name: "Sri Lakshmi Traders",
  type: "Kirana",
  city: "Hyderabad",
  pincode: "500001",
  gstin: "36ABCDE1234F1Z5",
}

export type Shop = typeof MOCK_SHOP

// 2 digits state, 5 letters, 4 digits, 1 letter, 1 entity char, Z, 1 checksum char
export const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
