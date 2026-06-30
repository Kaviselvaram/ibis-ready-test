import { z } from "zod";
import { createSchema } from "../common/schemaFactory.js";

export const CheckoutRequest = createSchema({
  planId: z.string(),
  currency: z.string().default("INR")
});

export const CheckoutResponse = createSchema({
  checkoutUrl: z.string().url(),
  transactionId: z.string()
});

export const PaymentStatusResponse = createSchema({
  transactionId: z.string(),
  status: z.enum(["PENDING", "SUCCESS", "FAILED"]),
  amount: z.number().positive(),
  currency: z.string()
});
