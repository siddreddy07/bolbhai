import { env } from "./env.js";

// Change cookie and token settings here once; the whole app follows.
export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.NODE_ENV === "production",
} as const;

export const ACCESS_TOKEN_EXPIRES = "15m";
export const REFRESH_TOKEN_EXPIRES = "7d";
