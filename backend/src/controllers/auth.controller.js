import { login, refresh, logout, signup, requestPasswordReset, resetPassword } from "../services/AuthService.js";
import { AnalyticsRepository } from "../repositories/AnalyticsRepository.js";
import { verifyTurnstile } from "../utils/turnstile.js";
import { AppError } from "../errors/AppError.js";

// Enforce Cloudflare Turnstile when configured (no-op otherwise).
async function ensureHuman(req, validatedData) {
  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
  const ok = await verifyTurnstile(validatedData?.turnstileToken, ip);
  if (!ok) throw new AppError("Human verification failed. Please try again.", 403, "TURNSTILE_FAILED");
}

// Fire-and-forget login event → feeds the daily login streak (gamification).
// Never blocks or fails the auth response. `sub` is decoded from the freshly
// minted (already-trusted) access token, no verification needed here.
function logLogin(accessToken) {
  try {
    const payload = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString("utf8"));
    if (payload?.sub) {
      AnalyticsRepository.logEvent({ profile_id: payload.sub, event_type: "login" }).catch(() => {});
    }
  } catch { /* non-fatal */ }
}

// Refresh-token cookie options.
// When the frontend and backend are on DIFFERENT domains (e.g. Cloudflare Pages
// + Render), the browser only sends the cookie cross-site if it is
// `SameSite=None; Secure`. Set COOKIE_CROSS_SITE=true in that case. When they
// share a parent domain, leave it unset for the safer `SameSite=Strict`.
const isProd = () => process.env.NODE_ENV === "production";
const crossSite = () => process.env.COOKIE_CROSS_SITE === "true";

const cookieOptions = () => ({
  httpOnly: true,
  secure: isProd(),                       // HTTPS-only in production
  sameSite: crossSite() ? "None" : "Strict",
  maxAge: 7 * 24 * 60 * 60 * 1000         // 7 days
});

const setRefreshCookie = (res, token) => res.cookie("refresh_token", token, cookieOptions());

export const signupController = async ({ req, res, validatedData }) => {
  await ensureHuman(req, validatedData);
  await signup(validatedData);
  const { accessToken, refreshToken } = await login({ email: validatedData.email, password: validatedData.password });
  setRefreshCookie(res, refreshToken);
  logLogin(accessToken);
  return { access_token: accessToken };
};

export const loginController = async ({ req, res, validatedData }) => {
  await ensureHuman(req, validatedData);
  const { accessToken, refreshToken } = await login(validatedData);
  setRefreshCookie(res, refreshToken);
  logLogin(accessToken);
  return { access_token: accessToken };
};

export const refreshController = async ({ req, res }) => {
  const token = req.cookies?.refresh_token;
  const { accessToken, refreshToken } = await refresh(token);
  setRefreshCookie(res, refreshToken);
  return { access_token: accessToken };
};

// Always returns { ok: true } — never reveals whether the email is registered.
export const forgotPasswordController = async ({ validatedData }) => {
  await requestPasswordReset(validatedData.email);
  return { ok: true };
};

export const resetPasswordController = async ({ validatedData }) => {
  return await resetPassword(validatedData.token, validatedData.password);
};

export const logoutController = async ({ req, res, user }) => {
  await logout(user?.jti);
  // clearCookie must use matching attributes to actually clear a cross-site cookie.
  const { maxAge, ...clearOpts } = cookieOptions();
  res.clearCookie("refresh_token", clearOpts);
  return { message: "Logged out successfully" };
};
