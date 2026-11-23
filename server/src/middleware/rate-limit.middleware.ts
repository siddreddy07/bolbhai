import type { NextFunction, Request, Response } from "express";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { env } from "../config/env.js";

// Rate limits kept in Upstash Redis, one counter per logged-in user, so they hold even when the server runs more than once.
// Put it AFTER `auth` on a route. Without the Upstash settings the limits are simply off (and say so once).
const redis =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;
if (!redis) console.warn("Rate limits are OFF: no UPSTASH_REDIS_REST_URL / TOKEN");

type Window = `${number} ${"s" | "m" | "h"}`;

/** At most `requests` calls in `window` for each user, for the routes that use the same `name`. */
export function rateLimit(name: string, requests: number, window: Window) {
  const limiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(requests, window),
        prefix: `bolbhai:${name}`,
      })
    : null;

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!limiter) return next();
    try {
      const { success, reset } = await limiter.limit(req.user?.id ?? req.ip ?? "anyone");
      if (success) return next();
      const wait = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      res.setHeader("Retry-After", String(wait));
      res.status(429).json({ message: `Too many requests. Try again in ${wait} seconds.` });
    } catch (error) {
      // Redis is down: let the request through rather than block the shop
      console.error("Rate limit check failed:", error);
      next();
    }
  };
}

// The three limits, each shared by the routes of its kind.
export const sttLimit = rateLimit("stt", 10, "1 m"); // every call is a paid speech-to-text request
export const searchLimit = rateLimit("search", 120, "1 m"); // typing in any search box (they already wait and remember)
export const countLimit = rateLimit("count", 90, "1 m"); // the + / - on stock and on bills
