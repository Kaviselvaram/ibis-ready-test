import { Router } from "express";
import { withHandler } from "../utils/routeBuilder.js";
import { createOrderController, verifyPaymentController } from "../controllers/payment.controller.js";
import { z } from "zod";

const router = Router();

// Create a Razorpay order (amount computed server-side from the plan).
router.post("/order", withHandler({
  method: "POST",
  schema: z.object({
    planId: z.enum(["starter", "pro"]),
    addon: z.boolean().optional()
  }),
  requireAuth: true,
  rateLimit: { max: 20, windowMs: 60000, name: "pay_order", byUser: true }
}, createOrderController));

// Verify the Razorpay client callback signature and activate the subscription.
router.post("/verify", withHandler({
  method: "POST",
  schema: z.object({
    orderId: z.string().min(1).max(120),
    paymentId: z.string().min(1).max(120),
    signature: z.string().min(1).max(256),
    planId: z.enum(["starter", "pro"]),
    addon: z.boolean().optional()
  }),
  requireAuth: true,
  rateLimit: { max: 20, windowMs: 60000, name: "pay_verify", byUser: true }
}, verifyPaymentController));

export default router;
