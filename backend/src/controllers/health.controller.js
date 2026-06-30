import { getServiceSupabase } from "../config/supabase.js";
import { getRedisClient } from "../config/redis.js";
import { env } from "../config/env.js";
import { AppError } from "../errors/AppError.js";

export const getHealth = async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
};

export const getLiveness = async () => {
  return { status: "alive" };
};

export const getReadiness = async () => {
  try {
    const supabase = getServiceSupabase();
    // Validate Supabase
    const { error: dbError } = await supabase.from('profiles').select('id').limit(1);
    if (dbError) throw new Error(`Supabase unreachable: ${dbError.message}`);

    // Validate Redis
    const redis = getRedisClient();
    if (redis) {
      await redis.ping();
    }

    // Validate Env
    if (!env.JWT_SECRET || !env.SUPABASE_URL) {
      throw new Error("Missing critical environment configurations");
    }

    return { status: "ready", dependencies: { database: "up", cache: redis ? "up" : "disabled" } };
  } catch (error) {
    throw new AppError(`Readiness check failed: ${error.message}`, 503, "SERVICE_UNAVAILABLE");
  }
};
