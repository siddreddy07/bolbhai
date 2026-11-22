/** Matches ShopType in the server's contract.prisma. */
export const SHOP_TYPES = ["GROCERY", "CAFE"] as const
export type ShopType = (typeof SHOP_TYPES)[number]

/** A shop exactly as POST /api/shops and GET /api/shops return it. */
export type Shop = {
  id: string
  name: string | null
  type: ShopType
  gstin: string
}

// 2 digits state, 5 letters, 4 digits, 1 letter, 1 entity char, Z, 1 checksum char
export const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
