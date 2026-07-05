import crypto from "crypto";
import { env } from "../config/env.js";
import { PaymentRepository } from "../repositories/PaymentRepository.js";
import { AppError } from "../errors/AppError.js";
import { getRedisClient } from "../config/redis.js";
import { PRICING_PLANS, isPaymentEnabled } from "./ContentService.js";

const RAZORPAY_API = "https://api.razorpay.com/v1";

function planOr404(planId) {
  const plan = PRICING_PLANS.find((p) => p.id === planId);
  if (!plan) throw new AppError("Unknown plan", 400, "BAD_INPUT");
  return plan;
}

function amountPaise(plan, withAddon) {
  const rupees = plan.price + (withAddon ? (plan.addon?.price || 0) : 0);
  return rupees * 100;
}

function validUntilFor(plan) {
  const d = new Date();
  if (plan.period === "year") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

// Create a Razorpay order server-side (amount is never trusted from the client).
// Returns what the browser needs to open Razorpay Checkout.
export const createOrder = async (userId, planId, withAddon = false) => {
  if (!isPaymentEnabled()) throw new AppError("Payments are not available yet.", 503, "PAYMENTS_DISABLED");
  const plan = planOr404(planId);
  const amount = amountPaise(plan, withAddon);

  const auth = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const res = await fetch(`${RAZORPAY_API}/orders`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount,
      currency: "INR",
      receipt: `ibis_${String(userId).slice(0, 8)}_${Date.now()}`,
      notes: { user_id: userId, plan_id: planId, addon: withAddon ? "1" : "0" }
    })
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new AppError("Could not start the payment. Please try again.", 502, "RAZORPAY_ORDER_FAILED", body.slice(0, 200));
  }
  const order = await res.json();
  return { orderId: order.id, amount, currency: "INR", keyId: env.RAZORPAY_KEY_ID, planId, planName: plan.name };
};

// Verify the Razorpay client callback signature and activate the subscription.
// Idempotent: the payment id is the dedupe key in process_payment.
export const verifyAndActivate = async ({ userId, orderId, paymentId, signature, planId, withAddon = false }) => {
  if (!isPaymentEnabled()) throw new AppError("Payments are not available yet.", 503, "PAYMENTS_DISABLED");
  if (!orderId || !paymentId || !signature) throw new AppError("Missing payment fields", 400, "BAD_INPUT");

  const expected = crypto.createHmac("sha256", env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
  if (!timingSafeStringEqual(expected, signature)) {
    throw new AppError("Payment verification failed.", 400, "BAD_SIGNATURE");
  }

  const plan = planOr404(planId);
  const { data, error } = await PaymentRepository.processPayment(
    userId, paymentId, amountPaise(plan, withAddon), "INR", validUntilFor(plan)
  );
  if (error) throw new AppError("Payment could not be recorded. Contact support if charged.", 500, "PAYMENT_RPC_ERROR");
  return { status: "active", plan: planId, valid_until: validUntilFor(plan), data };
};

export { isPaymentEnabled };

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
