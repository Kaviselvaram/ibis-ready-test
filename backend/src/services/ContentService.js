import { getR2Client } from "../config/s3.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../config/env.js";
import { AppError } from "../errors/AppError.js";
import { PaymentRepository } from "../repositories/PaymentRepository.js";
import { ContentRepository } from "../repositories/ContentRepository.js";
import { SettingsRepository } from "../repositories/SettingsRepository.js";

const PRICING_KEY = "pricing_config";

// Editable pricing defaults. Admins can override every field from the portal
// (stored in app_settings.pricing_config); the client + payment engine read the
// live config, so nothing is hardcoded on the frontend.
export const DEFAULT_PRICING = {
  currency: "INR",
  defaultPlan: "pro",
  plans: [
    {
      id: "starter", name: "1-Month", period: "month", price: 2499,
      badge: "Most Flexible", buttonText: "Get Started",
      addon: { label: "Mentor doubt chat", price: 499 },
      features: [
        { text: "1 Chapter Access", enabled: true },
        { text: "Core Physics Lessons", enabled: true },
        { text: "Active Doubt Support", enabled: true },
        { text: "Basic Practice", enabled: true },
        { text: "Progression Tracking", enabled: false },
        { text: "Rewards & Badges", enabled: false },
        { text: "Leaderboard & Ranking", enabled: false }
      ]
    },
    {
      id: "pro", name: "12-Month", period: "year", price: 14999,
      badge: "Best Value", buttonText: "Enroll Now",
      addon: { label: "Printed prep books", price: 1999 },
      features: [
        { text: "Full Access (All Chapters)", enabled: true },
        { text: "Core Physics Lessons", enabled: true },
        { text: "Active Doubt Support", enabled: true },
        { text: "Basic Practice", enabled: true },
        { text: "Progression Tracking", enabled: true },
        { text: "Rewards & Badges", enabled: true },
        { text: "Leaderboard & Ranking", enabled: true }
      ]
    }
  ]
};

// Back-compat: the default plan list (payment engine reads live config below).
export const PRICING_PLANS = DEFAULT_PRICING.plans;

// `available` is config-derived: payments go live the moment RAZORPAY_KEY_ID +
// RAZORPAY_KEY_SECRET are set; otherwise the client shows "Coming soon".
export const isPaymentEnabled = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

// The admin-editable pricing config (falls back to defaults until an admin saves).
export const getPricingConfig = async () => {
  const stored = await SettingsRepository.get(PRICING_KEY);
  return (stored && Array.isArray(stored.plans) && stored.plans.length) ? stored : DEFAULT_PRICING;
};

export const updatePricingConfig = async (config) => {
  await SettingsRepository.set(PRICING_KEY, config);
  return config;
};

export const getPricing = async () => {
  const cfg = await getPricingConfig();
  return { ...cfg, available: isPaymentEnabled() };
};

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
