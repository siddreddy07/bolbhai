// Sign up is only for these mail providers (no made-up or throwaway addresses). Add a domain here to allow it.
// The website has the same list in client/lib/email-domains.ts: keep the two the same.
export const EMAIL_DOMAINS = [
  // Google
  "gmail.com", "googlemail.com",
  // Microsoft
  "outlook.com", "outlook.in", "hotmail.com", "live.com", "msn.com",
  // Yahoo
  "yahoo.com", "yahoo.in", "yahoo.co.in", "ymail.com", "rocketmail.com",
  // Apple
  "icloud.com", "me.com", "mac.com",
  // Proton
  "protonmail.com", "proton.me", "pm.me",
  // others
  "zoho.com", "zohomail.in", "aol.com", "rediffmail.com",
];

export const isAllowedEmail = (email: string) => EMAIL_DOMAINS.includes(email.trim().toLowerCase().split("@").pop() ?? "");
