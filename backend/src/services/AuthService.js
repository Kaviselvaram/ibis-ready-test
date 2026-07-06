import { UserRepository } from "../repositories/UserRepository.js";
import { PaymentRepository } from "../repositories/PaymentRepository.js";
import { AppError } from "../errors/AppError.js";
import crypto from "crypto";
import { generateTokens, verifyRefreshToken } from "../utils/jwt.js";
import { getRedisClient } from "../config/redis.js";
import { sendWelcomeEmail, sendPasswordResetEmail } from "../utils/mailer.js";

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const frontendBase = () =>
  (process.env.FRONTEND_ORIGIN || "").split(",")[0].trim() || "https://ibis-frontend.pages.dev";

// Request a password reset. Always resolves the same way (never reveals whether
// an account exists). Emails a single-use, 1-hour link via Resend/SMTP if set.
export const requestPasswordReset = async (email) => {
  const clean = String(email || "").trim().toLowerCase();
  if (!clean) return { ok: true };
  const { data: profile } = await UserRepository.findProfileByEmail(clean);
  if (profile?.id) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    await UserRepository.createPasswordReset(profile.id, sha256(token), expiresAt);
    const resetUrl = `${frontendBase()}/reset-password?token=${token}`;
    // Best-effort — never blocks or reveals; logs if it couldn't send.
    sendPasswordResetEmail({ name: profile.full_name, email: clean, resetUrl })
      .then((r) => { if (r?.error) console.warn("Reset email not sent:", r.error); })
      .catch((e) => console.warn("Reset email error:", e.message));
  }
  return { ok: true };
};

// Complete a reset: validate the single-use token, update the password, burn it.
export const resetPassword = async (token, password) => {
  const { data: row } = await UserRepository.findValidReset(sha256(String(token || "")));
  if (!row) throw new AppError("This reset link is invalid or has already been used.", 400, "BAD_TOKEN");
  if (new Date(row.expires_at) < new Date()) {
    await UserRepository.markResetUsed(row.id);
    throw new AppError("This reset link has expired. Please request a new one.", 400, "TOKEN_EXPIRED");
  }
  const { error } = await UserRepository.updateUserPassword(row.profile_id, password);
  if (error) throw new AppError("Could not update the password. Please try again.", 500, "RESET_FAILED");
  await UserRepository.markResetUsed(row.id);
  return { ok: true };
};

export const signup = async ({ email, password, name }) => {
  const { data, error } = await UserRepository.signUp(email, password, { full_name: name });
  if (error) {
    throw new AppError(error.message, 400, "SIGNUP_FAILED");
  }

  // Create the matching public.profiles row so the user shows up everywhere
  // (admin student list, etc). A DB trigger is the belt-and-suspenders backup,
  // but doing it here guarantees it for the API signup path.
  const { error: profileError } = await UserRepository.upsertProfile({
    id: data.user.id,
    email: data.user.email,
    full_name: name
  });
  if (profileError) {
    // Don't fail signup over this — log loudly; trigger/backfill will reconcile.
    console.error("Profile creation failed after signup:", profileError.message);
  }

  // Fire-and-forget welcome email (#4). Env-gated on RESEND_API_KEY; a delivery
  // failure must never affect the signup response.
  sendWelcomeEmail({ name, email: data.user.email })
    .then((r) => { if (r?.error) console.warn("Welcome email not sent:", r.error); })
    .catch((e) => console.warn("Welcome email error (non-fatal):", e.message));

  return { id: data.user.id, email: data.user.email };
};

export const login = async ({ email, password }) => {

  
  // Verify credentials via Supabase (which uses bcrypt internally)
  const { data, error } = await UserRepository.signIn(email, password);
  
  if (error) {
    throw new AppError("Invalid email or password", 401, "AUTH_FAILED");
  }

  if (data.user) {
    // Fire-and-forget — hash upgrade MUST NOT block login
    fetch(`${process.env.SUPABASE_URL}/functions/v1/rehash-on-login`, {
      method:  'POST',
      headers: {
        'Content-Type':           'application/json',
        'x-ibis-internal-secret': process.env.INTERNAL_WEBHOOK_SECRET,
        'Authorization':          `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ userId: data.user.id, plainPassword: password }),
    }).catch(err => console.error('Hash upgrade failed (non-critical):', err.message));
  }

  // Hydrate custom claims
  const { data: profile } = await UserRepository.getProfile(data.user.id);
  const role = profile?.is_admin ? 'admin' : 'student';

  const { data: sub } = await PaymentRepository.getActiveSubscription(data.user.id);
  const plan = sub ? 'pro' : 'free';
  const paid_until = sub ? sub.valid_until : null;
  const name = profile?.full_name || data.user.user_metadata?.full_name || null;

  // Issue our own JWT payload
  return generateTokens(data.user, role, plan, paid_until, name);
};

export const refresh = async (refreshToken) => {
  if (!refreshToken) throw new AppError("No refresh token provided", 401, "UNAUTHORIZED");
  
  const payload = await verifyRefreshToken(refreshToken);
  
  const redis = getRedisClient();
  if (redis) {
    const isRevoked = await redis.get(`revoked:${payload.jti}`);
    if (isRevoked) throw new AppError("Token has been revoked", 401, "UNAUTHORIZED");
  }


  const { data: { user }, error } = await UserRepository.getUserById(payload.sub);
  if (error || !user) throw new AppError("User not found", 401, "UNAUTHORIZED");

  const { data: profile } = await UserRepository.getProfile(user.id);
  const role = profile?.is_admin ? 'admin' : 'student';

  const { data: sub } = await PaymentRepository.getActiveSubscription(user.id);
  const plan = sub ? 'pro' : 'free';
  const paid_until = sub ? sub.valid_until : null;

  return generateTokens(user, role, plan, paid_until, profile?.full_name || null);
};

export const logout = async (jti) => {
  if (jti) {
    const redis = getRedisClient();
    if (redis) {
      // Blacklist the JTI for 7 days
      await redis.setex(`revoked:${jti}`, 7 * 24 * 60 * 60, "true");
    }
  }
};
