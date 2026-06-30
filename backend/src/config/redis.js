import { Redis } from "@upstash/redis";
import { env } from "./env.js";

import { logger } from "../utils/logger.js";

let redisInstance = null;

export const getRedisClient = () => {
  if (redisInstance) return redisInstance;

  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    logger.warn("⚠️ Upstash Redis credentials not set. Rate limiting/caching bypassed.");
    return null;
  }

  redisInstance = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });

  return redisInstance;
};
