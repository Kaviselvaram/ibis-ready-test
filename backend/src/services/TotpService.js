import crypto from "crypto";
import { authenticator } from "otplib";
import { env } from "../config/env.js";
import { SecurityRepository } from "../repositories/SecurityRepository.js";
import { AppError } from "../errors/AppError.js";

authenticator.options = { window: 1 }; // +/- 1 step tolerance (30s)

const ALGORITHM = "aes-256-gcm";

const encryptSeed = (seed) => {
  if (!env.TOTP_MASTER_KEY) throw new AppError("Server missing TOTP_MASTER_KEY", 500);
  
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(env.TOTP_MASTER_KEY, 'utf-8'), iv);
  
  let encrypted = cipher.update(seed, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

const decryptSeed = (encryptedPayload) => {
  if (!env.TOTP_MASTER_KEY) throw new AppError("Server missing TOTP_MASTER_KEY", 500);

  const [ivHex, authTagHex, encryptedHex] = encryptedPayload.split(':');
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new AppError("Invalid stored TOTP seed format", 500, "INTERNAL_ERROR");
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM, 
    Buffer.from(env.TOTP_MASTER_KEY, 'utf-8'), 
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

export const generateTotpSetup = async (adminId) => {
  const secret = authenticator.generateSecret();
  const encryptedSecret = encryptSeed(secret);


  const { error } = await SecurityRepository.updateTotpSeed(adminId, encryptedSecret);

  if (error) throw new AppError("Failed to save TOTP setup", 500, "DB_ERROR");

  return authenticator.keyuri("admin@ibisphysics.com", "Ibis Physics Portal", secret);
};

export const verifyTotp = async (adminId, code) => {

  const { data: profile } = await SecurityRepository.getTotpSeed(adminId);

  if (!profile || !profile.totp_seed) {
    throw new AppError("TOTP not set up for this admin", 400, "TOTP_NOT_CONFIGURED");
  }

  const secret = decryptSeed(profile.totp_seed);
  const isValid = authenticator.verify({ token: code, secret });
  
  if (!isValid) {
    throw new AppError("Invalid TOTP code", 401, "UNAUTHORIZED");
  }

  return true;
};
