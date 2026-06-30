import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env.js";

import { logger } from "../utils/logger.js";

let s3ClientInstance = null;

export const getR2Client = () => {
  if (s3ClientInstance) return s3ClientInstance;

  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    logger.warn("⚠️ Missing Cloudflare R2 credentials. S3 client bypassed.");
    return null;
  }

  s3ClientInstance = new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });

  return s3ClientInstance;
};
