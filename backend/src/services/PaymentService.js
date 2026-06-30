import crypto from "crypto";
import { env } from "../config/env.js";
import { PaymentRepository } from "../repositories/PaymentRepository.js";
import { AppError } from "../errors/AppError.js";
import { getRedisClient } from "../config/redis.js";

function timingSafeStringEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) {
    crypto.timingSafeEqual(Buffer.from(a), Buffer.from(a));
    return false;
  }
  return crypto.timingSafeEqual(
    Buffer.from(a, 'utf8'),
    Buffer.from(b, 'utf8')
  );
}

export const handleRazorpayWebhook = async (rawBody, signature, headers) => {
  if (!env.RAZORPAY_WEBHOOK_SECRET) throw new AppError("Webhook secret not configured", 500);

  // REMEDIATION 3: Route-scoped bypass that skips rate limit, but NOT HMAC validation
  const bypassHeader = headers?.['x-ibis-webhook-secret'] ?? '';
  const secret       = process.env.INTERNAL_WEBHOOK_SECRET ?? '';

  const isTrustedCaller = (
    secret.length >= 32 &&
    timingSafeStringEqual(bypassHeader, secret)
  );

  if (!isTrustedCaller) {
    // Apply sliding window rate limit
    const redis = getRedisClient();
    if (redis) {
      const ip = headers?.["x-forwarded-for"] || "anonymous";
      const key = `ratelimit:webhook:${ip}`;
      const current_time = Date.now();
      const window_start = current_time - 60000;

      const multi = redis.multi();
      multi.zremrangebyscore(key, 0, window_start);
      multi.zcard(key);
      multi.zadd(key, { score: current_time, member: `${current_time}-${Math.random()}` });
      multi.expire(key, 60);
      
      const results = await multi.exec();
      if (results[1] >= 50) {
        throw new AppError("Rate limit exceeded", 429, "RATE_LIMITED");
      }
    }
  }

  const expectedSig = crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
                            .update(rawBody)
                            .digest('hex');

  if (!timingSafeStringEqual(expectedSig, signature)) {
    throw new AppError("Invalid webhook signature", 400, "BAD_SIGNATURE");
  }

  const parsedBody = JSON.parse(rawBody.toString('utf-8'));
  const eventId = parsedBody.id;
  if (!eventId) throw new AppError("Missing event ID", 400, "BAD_INPUT");

  if (parsedBody.event === 'payment.captured') {
    const payment = parsedBody.payload.payment.entity;
    const userId = payment.notes?.user_id;

    if (userId) {
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      const { data, error } = await PaymentRepository.processPayment(
        userId,
        eventId,
        payment.amount,
        payment.currency,
        validUntil.toISOString()
      );

      if (error) throw new AppError('Payment processing failed', 500, 'PAYMENT_RPC_ERROR');
      return data;
    }
  }

  return { status: 'ignored' };
};
