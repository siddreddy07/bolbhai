import { Redis } from "@upstash/redis";
import { env } from "./env.js";

// The one Upstash Redis connection (null when the settings are missing).
export const redis =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN })
    : null;
