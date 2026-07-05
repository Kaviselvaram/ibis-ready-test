import { api } from "../api/ApiClient";

export const PaymentRepository = {
  // Create a server-side Razorpay order for a plan (+ optional add-on).
  createOrder: (planId, addon = false) => api.post("/payment/order", { planId, addon }),
  // Verify the Razorpay callback signature and activate the subscription.
  verify: (payload) => api.post("/payment/verify", payload)
};
