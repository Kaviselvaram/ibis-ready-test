import { getRedisClient } from "../config/redis.js";
import { AppError } from "../errors/AppError.js";

export const rateLimit = ({ maxRequests = 60, windowMs = 60000 }) => {
  return async (req, res, next) => {
    try {
      const redis = getRedisClient();
      if (!redis) return next();

      const ip = req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "anonymous";
      const route = req.route ? req.route.path : req.path;
      const rateLimitKey = `rate_limit:${ip}:${route}`;
      
      const currentRequests = await redis.incr(rateLimitKey);
      if (currentRequests === 1) {
        await redis.pexpire(rateLimitKey, windowMs);
      }

      if (currentRequests > maxRequests) {
        res.set('Retry-After', Math.ceil(windowMs / 1000));
        throw new AppError("Too many requests. Please slow down.", 429, "RATE_LIMITED");
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
