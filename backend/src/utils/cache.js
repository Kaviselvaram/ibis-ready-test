import { getRedisClient } from "../config/redis.js";

// Flag-gated cache-aside helper over Upstash Redis.
// - Enabled by default; set CACHE_ENABLED=false to bypass entirely (instant rollback).
// - Every read falls back to the live producer on any Redis error or miss, so the
//   database is always the source of truth and a Redis outage degrades gracefully.
const cacheEnabled = () => process.env.CACHE_ENABLED !== "false";

/**
 * cache-aside: return cached value for `key`, else run `producer()`, cache it, return it.
 * @param {string} key
 * @param {number} ttlSeconds
 * @param {() => Promise<any>} producer
 */
export async function cached(key, ttlSeconds, producer) {
  const redis = getRedisClient();
  if (!redis || !cacheEnabled()) return producer();

  try {
    const hit = await redis.get(key);
    if (hit !== null && hit !== undefined) return hit;
  } catch (_) {
    // Redis unreachable → fall through to the live producer.
  }

  const value = await producer();
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (_) {
    // Non-fatal: value is still returned to the caller.
  }
  return value;
}

/** Best-effort cache invalidation (never throws). */
export async function invalidate(...keys) {
  const redis = getRedisClient();
  if (!redis || keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch (_) {
    /* non-fatal */
  }
}

export const CACHE_KEYS = {
  courseTree: "course:tree",
  questionBank: "qbank:all",
  profile: (id) => `profile:${id}`,
  subscription: (id) => `sub:${id}`,
  leaderboard: "lb:global",
  leaderboardBatch: (id) => `lb:batch:${id}`
};
