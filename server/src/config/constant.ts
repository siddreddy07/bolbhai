import { env } from "./env.js";

// Change cookie and token settings here once; the whole app follows.
export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.NODE_ENV === "production",
} as const;

// Sent when the access token has expired, so the client knows to call /refresh.
export const TOKEN_EXPIRED_STATUS = 498;

export const ACCESS_TOKEN_EXPIRES = "15m";
export const REFRESH_TOKEN_EXPIRES = "7d";

export const PASSWORD_SALT_ROUNDS = 10;
