import { z } from "zod";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local from the monorepo root
dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });

const envSchema = z.object({
  PORT: z.string().default("4000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  INTERNAL_WEBHOOK_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  ADMIN_SECURITY_EMAIL: z.string().optional(),
  FRONTEND_ORIGIN: z.string().optional(),      // comma-separated allowed browser origins (prod CORS)
  COOKIE_CROSS_SITE: z.string().optional(),    // "true" when frontend/backend are on different domains
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 chars"),
  TOTP_MASTER_KEY: z.string().min(32).max(32, "TOTP_MASTER_KEY must be exactly 32 chars").optional(),
  // Payments (Razorpay). All optional — when KEY_ID + KEY_SECRET are present the
  // checkout goes live automatically; otherwise pricing shows "Coming soon".
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  // Cloudflare Turnstile (free). Login/signup enforce it only when the secret is
  // set; otherwise the captcha is dormant and auth behaves exactly as before.
  TURNSTILE_SECRET_KEY: z.string().optional()
});

const parsedEnv = envSchema.safeParse({
  ...process.env,
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
});

import { logger } from "../utils/logger.js";

if (!parsedEnv.success) {
  logger.error("❌ Invalid environment variables:", { errors: parsedEnv.error.format() });
  process.exit(1);
}

export const env = parsedEnv.data;
