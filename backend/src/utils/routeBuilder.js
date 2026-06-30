import { z } from "zod";
import { AppError } from "../errors/AppError.js";
import { verifyAccessToken } from "./jwt.js";
import { getRedisClient } from "../config/redis.js";
import { getServiceSupabase } from "../config/supabase.js";
import * as Sentry from "@sentry/node";
import { sendResponse } from "./responseFormatter.js";
import { logger } from "./logger.js";
import { ERROR_CODES } from "../../../shared/contracts/v1/common/ErrorCodes.js";

async function notifyAdminOfLockout({ userId, ip }) {
  await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      from:    'security@ibisphysics.com',
      to:      process.env.ADMIN_SECURITY_EMAIL,
      subject: '[SECURITY] Admin TOTP lockout triggered',
      html: `
        <p><strong>TOTP lockout triggered</strong></p>
        <p>User ID: ${userId}</p>
        <p>IP: ${ip}</p>
        <p>Time: ${new Date().toISOString()}</p>
        <p>If the admin did not trigger this, rotate credentials immediately.</p>
      `,
    }),
  });
}

async function enforceRateLimit(redis, res, key, rateLimitConfig, ip, user) {
  const current_time = Date.now();
  const window_duration_ms = rateLimitConfig.windowMs;
  const window_start = current_time - window_duration_ms;

  const multi = redis.multi();
  multi.zremrangebyscore(key, 0, window_start);
  multi.zcard(key);
  multi.zadd(key, { score: current_time, member: `${current_time}-${Math.random()}` });
  multi.expire(key, Math.ceil(window_duration_ms / 1000));
  
  const results = await multi.exec();
  const count = results[1];

  res.setHeader("X-RateLimit-Limit", rateLimitConfig.max);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, rateLimitConfig.max - (count + 1)));
  res.setHeader("X-RateLimit-Reset", Math.ceil((current_time + window_duration_ms) / 1000));

  if (count >= rateLimitConfig.max) {
    res.setHeader("Retry-After", Math.ceil(window_duration_ms / 1000));
    
    if (rateLimitConfig.name === 'totp' && user) {
      const adminJti = user.jti;
      const ttl = Math.max(1, user.exp - Math.floor(Date.now() / 1000));
      
      if (adminJti) {
        await redis.setex(`revoked:${adminJti}`, ttl, "true");
      }
      
      const supabaseServiceRole = getServiceSupabase();
      await supabaseServiceRole.from('security_events').insert({
        event_type: 'TOTP_LOCKOUT',
        user_id: user.sub,
        ip_address: ip,
        metadata: { jti: adminJti, ttl },
        created_at: new Date().toISOString()
      });

      Sentry.captureMessage('TOTP lockout triggered', {
        level: 'fatal',
        tags:  { event_type: 'TOTP_LOCKOUT' },
        user:  { id: user.sub },
        extra: { ip, ttl }
      });

      notifyAdminOfLockout({
        userId: user.sub,
        ip
      }).catch(err => logger.warn('Lockout email failed (non-critical):', { error: err.message }));

      throw new AppError("Too many TOTP attempts. Session terminated.", 429, "TOTP_LOCKED");
    }
    
    throw new AppError("Too many requests", 429, "RATE_LIMITED");
  }
}

/**
 * 9-Step API Pipeline Wrapper (Hardened)
 * 1. Method guard
 * 2. Request ID Injection
 * 3. IP-based Rate Limiting (Protects JWT decryption)
 * 4. Authentication (JWT verification)
 * 5. User-based Rate Limiting (Protects business logic per-tenant)
 * 6. Authorization (RBAC role check)
 * 7. Validation (Zod schema parse - Post-Auth)
 * 8. Execute controller logic
 * 9. Response serialization & Centralized error catch
 */
export const withHandler = (config, handlerFn) => {
  return async (req, res, next) => {
    try {
      // 1. Method guard
      if (config.method && req.method !== config.method) {
        throw new AppError(`Method ${req.method} not allowed`, 405, "METHOD_NOT_ALLOWED");
      }

      // 2. Request ID Injection
      if (!req.requestId) {
        req.requestId = crypto.randomUUID ? crypto.randomUUID() : "req-" + Date.now();
      }

      const redis = getRedisClient();
      const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "anonymous";

      // 3. IP-based Rate Limiting
      if (config.rateLimit && !config.rateLimit.byUser) {
        if (redis) {
          const key = `ratelimit:${config.rateLimit.name || req.route?.path || req.path}:ip:${ip}`;
          await enforceRateLimit(redis, res, key, config.rateLimit, ip, null);
        }
      }

      // 4. Authentication (JWT)
      if (config.requireAuth) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          throw new AppError("Missing or invalid authorization header", 401, ERROR_CODES.UNAUTHORIZED);
        }
        const token = authHeader.split(" ")[1];
        const payload = await verifyAccessToken(token);

        // Check revocation list in Redis (jti)
        if (redis) {
          const isRevoked = await redis.get(`revoked:${payload.jti}`);
          if (isRevoked) {
            throw new AppError("Token has been revoked", 401, ERROR_CODES.UNAUTHORIZED);
          }
        }
        req.user = payload;
      }

      // 5. User-based Rate Limiting (Authenticated traffic protection)
      if (config.rateLimit && config.rateLimit.byUser && req.user) {
        if (redis) {
          const key = `ratelimit:${config.rateLimit.name || req.route?.path || req.path}:user:${req.user.sub}`;
          await enforceRateLimit(redis, res, key, config.rateLimit, ip, req.user);
        }
      }

      // 6. Authorization (RBAC)
      if (config.requireAuth && config.roles && config.roles.length > 0) {
        if (!config.roles.includes(req.user.role)) {
          throw new AppError(`Forbidden: Requires one of [${config.roles.join(', ')}]`, 403, ERROR_CODES.FORBIDDEN);
        }
      }

      // 7. Validation (Zod)
      let validatedData = {};
      if (config.schema) {
        const source = req.method === "GET" ? req.query : (req.body || {});
        const parseResult = config.schema.safeParse(source);
        if (!parseResult.success) {
          throw new AppError("Validation failed", 400, ERROR_CODES.VALIDATION_ERROR, parseResult.error.format());
        }
        validatedData = parseResult.data;
      }

      // 8. Execute controller logic
      const result = await handlerFn({ req, res, validatedData, user: req.user });

      // 9. Response serialization
      if (!res.headersSent && result !== undefined) {
        sendResponse(res, 200, result);
      }
    } catch (error) {
      // 10. Centralized error catch
      next(error);
    }
  };
};
