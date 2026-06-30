import { getRedisClient } from "../config/redis.js";

export const cache = (ttlSeconds) => {
  return async (req, res, next) => {
    if (req.method !== "GET") return next();
    
    const redis = getRedisClient();
    if (!redis) return next();

    const userId = req.user?.id || "public";
    const cacheKey = `cache:${req.originalUrl}:${userId}`;

    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
      }

      const originalJson = res.json;
      res.json = function (body) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const bodyToCache = { ...body, meta: { ...body.meta, cached: true } };
          redis.setex(cacheKey, ttlSeconds, JSON.stringify(bodyToCache)).catch(console.error);
        }
        return originalJson.call(this, body);
      };
      
      next();
    } catch (error) {
      next(error);
    }
  };
};
