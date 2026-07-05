import { createOrder, verifyAndActivate } from "../services/PaymentService.js";

// Create a Razorpay order for the signed-in user.
export const createOrderController = async ({ validatedData, user }) => {
  return await createOrder(user.sub, validatedData.planId, validatedData.addon === true);
};

// Verify the Razorpay client callback and activate the subscription.
export const verifyPaymentController = async ({ validatedData, user }) => {
  return await verifyAndActivate({
    userId: user.sub,
    orderId: validatedData.orderId,
    paymentId: validatedData.paymentId,
    signature: validatedData.signature,
    planId: validatedData.planId,
    withAddon: validatedData.addon === true
  });
};
