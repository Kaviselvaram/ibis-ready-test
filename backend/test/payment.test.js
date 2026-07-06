import { test } from "node:test";
import assert from "node:assert/strict";
// Static imports so env.js (dotenv) loads exactly once, before any test mutates
// process.env — otherwise a later import would re-inject .env.local values.
import { isPaymentEnabled, getPricing } from "../src/services/ContentService.js";
import { createOrder, verifyAndActivate } from "../src/services/PaymentService.js";

const clearKeys = () => { delete process.env.RAZORPAY_KEY_ID; delete process.env.RAZORPAY_KEY_SECRET; };
const setKeys = () => { process.env.RAZORPAY_KEY_ID = "rzp_test_x"; process.env.RAZORPAY_KEY_SECRET = "secret_x"; };

// Payments must stay fully dormant until RAZORPAY_KEY_ID + KEY_SECRET are set,
// and light up automatically once they are — with no code change.
test("payments are disabled (503) when keys are absent", async () => {
  clearKeys();
  assert.equal(isPaymentEnabled(), false);
  await assert.rejects(() => createOrder("u1", "pro"), (e) => e.statusCode === 503);
  await assert.rejects(
    () => verifyAndActivate({ userId: "u1", orderId: "o", paymentId: "p", signature: "s", planId: "pro" }),
    (e) => e.statusCode === 503
  );
});

test("pricing.available reflects key presence", async () => {
  clearKeys();
  assert.equal((await getPricing()).available, false);
  setKeys();
  assert.equal((await getPricing()).available, true);
  clearKeys();
});

test("unknown plan is rejected (400) before any gateway call", async () => {
  setKeys();
  await assert.rejects(() => createOrder("u1", "does-not-exist"), (e) => e.statusCode === 400);
  clearKeys();
});
