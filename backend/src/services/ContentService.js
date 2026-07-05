import { getR2Client } from "../config/s3.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../config/env.js";
import { AppError } from "../errors/AppError.js";
import { PaymentRepository } from "../repositories/PaymentRepository.js";
import { ContentRepository } from "../repositories/ContentRepository.js";

// Pricing is served from the backend so the monetary values are never
// hardcoded in the client and can be changed without a frontend deploy.
export const PRICING_PLANS = [
  {
    id: "starter",
    name: "1-Month",
    period: "month",
    price: 2499,
    addon: { label: "Mentor doubt chat", price: 499 }
  },
  {
    id: "pro",
    name: "12-Month",
    period: "year",
    price: 14999,
    addon: { label: "Printed prep books", price: 1999 }
  }
];

// `available` is derived from configuration: payments go live automatically the
// moment RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET are set on the server; otherwise
// the client shows "Coming soon". Nothing hardcoded.
export const isPaymentEnabled = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

export const getPricing = () => ({
  currency: "INR",
  available: isPaymentEnabled(),
  plans: PRICING_PLANS
});

export const verifyAccess = async (user, profile) => {
  if (profile?.is_admin) return true;
  const { data: subscription, error } = await PaymentRepository.getActiveSubscription(user.id);
  if (error || !subscription) return false;
  return subscription.status === 'active' && new Date(subscription.valid_until) > new Date();
};

export const getSecureMediaLink = async (mediaId) => {
  const s3 = getR2Client();
  if (!s3) throw new AppError("Storage configuration error", 500, "STORAGE_CONFIGURATION_ERROR");

  const { data: media, error } = await ContentRepository.getMedia(mediaId);
  if (error || !media) {
    throw new AppError("Media not found", 404, "MEDIA_NOT_FOUND");
  }

  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: media.r2_object_key,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 900 });
  return { url, title: media.title, expires_in: 900, expiresAt: Date.now() + 900000 };
};

export const getProtectedVideo = async (topicId) => {
  const { data: video, error } = await ContentRepository.getVideoByTopicId(topicId);
  if (error || !video) {
    throw new AppError("Video not found", 404, "VIDEO_NOT_FOUND");
  }
  return video;
};
