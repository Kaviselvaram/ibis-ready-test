import nodemailer from "nodemailer";

// SMTP is optional. When SMTP_HOST/SMTP_USER/SMTP_PASS are set the mailer sends
// real email; otherwise isConfigured() is false and callers skip sending (the
// feature still returns a downloadable credentials CSV). This lets the whole
// bulk-onboarding flow ship now and start emailing the moment creds are added.
let transporter = null;

export function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransport() {
  if (!isMailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || "false") === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, html, text }) {
  const tx = getTransport();
  if (!tx) return { sent: false, skipped: true, reason: "SMTP not configured" };
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await tx.sendMail({ from, to, subject, html, text });
  return { sent: true };
}

export function credentialsEmail({ name, email, password, loginUrl }) {
  const url = loginUrl || process.env.FRONTEND_ORIGIN || "https://ibis-frontend.pages.dev";
  const subject = "Your Ibis Physics account is ready";
  const text =
    `Hi ${name || "there"},\n\n` +
    `Your Ibis Physics account has been created.\n\n` +
    `Login: ${url}/login\nEmail: ${email}\nTemporary password: ${password}\n\n` +
    `Please log in and change your password.\n\n— Ibis Physics`;
  const html =
    `<div style="font-family:system-ui,Arial,sans-serif;max-width:520px;margin:auto;color:#20160f">` +
    `<h2 style="font-family:Georgia,serif">Welcome to Ibis Physics 🦉</h2>` +
    `<p>Hi ${name || "there"}, your account is ready.</p>` +
    `<table style="border-collapse:collapse;margin:16px 0">` +
    `<tr><td style="padding:4px 12px 4px 0;color:#7a6a5f">Email</td><td><b>${email}</b></td></tr>` +
    `<tr><td style="padding:4px 12px 4px 0;color:#7a6a5f">Temporary password</td><td><b>${password}</b></td></tr>` +
    `</table>` +
    `<p><a href="${url}/login" style="display:inline-block;background:#d37150;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:700">Log in</a></p>` +
    `<p style="color:#7a6a5f;font-size:13px">Please change your password after your first login.</p>` +
    `</div>`;
  return { subject, text, html };
}

// ---- Resend (free tier) — used for transactional email like welcome mails ----
// Activates only when RESEND_API_KEY is set; otherwise callers no-op cleanly.
export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

const MAIL_FROM = () => process.env.MAIL_FROM || "Ibis Physics <no-reply@ibisphysics.com>";

async function sendViaResend({ to, subject, html, text }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from: MAIL_FROM(), to, subject, html, text })
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${body.slice(0, 200)}`);
  }
  return { sent: true };
}

export function welcomeEmail({ name, loginUrl }) {
  const url = loginUrl || process.env.FRONTEND_ORIGIN || "https://ibis-frontend.pages.dev";
  const subject = "Welcome to Ibis Physics 🦉";
  const text =
    `Hi ${name || "there"},\n\n` +
    `Welcome to Ibis Physics! Your account is ready.\n\n` +
    `Jump back in anytime: ${url}\n\n` +
    `Watch curated lessons, read notes, take practice tests, earn badges and climb the leaderboard.\n\n` +
    `— Ganesh & the Ibis Physics team`;
  const html =
    `<div style="font-family:system-ui,Arial,sans-serif;max-width:520px;margin:auto;color:#20160f">` +
    `<h2 style="font-family:Georgia,serif">Welcome to Ibis Physics 🦉</h2>` +
    `<p>Hi ${name || "there"}, your account is ready — let's make physics click.</p>` +
    `<p style="color:#5c4a3c">Watch curated lessons, read notes, take smart practice tests, earn badges and climb the leaderboard.</p>` +
    `<p style="margin:20px 0"><a href="${url}" style="display:inline-block;background:#c95f42;color:#fff;padding:11px 20px;border-radius:10px;text-decoration:none;font-weight:700">Open Ibis Physics</a></p>` +
    `<p style="color:#7a6a5f;font-size:13px">— Ganesh &amp; the Ibis Physics team</p>` +
    `</div>`;
  return { subject, text, html };
}

export function passwordResetEmail({ name, resetUrl }) {
  const subject = "Reset your Ibis Physics password";
  const text =
    `Hi ${name || "there"},\n\n` +
    `We received a request to reset your Ibis Physics password.\n\n` +
    `Reset it here (link expires in 1 hour): ${resetUrl}\n\n` +
    `If you didn't request this, you can safely ignore this email.\n\n— Ibis Physics`;
  const html =
    `<div style="font-family:system-ui,Arial,sans-serif;max-width:520px;margin:auto;color:#20160f">` +
    `<h2 style="font-family:Georgia,serif">Reset your password</h2>` +
    `<p>Hi ${name || "there"}, we received a request to reset your Ibis Physics password.</p>` +
    `<p style="margin:20px 0"><a href="${resetUrl}" style="display:inline-block;background:#c95f42;color:#fff;padding:11px 20px;border-radius:10px;text-decoration:none;font-weight:700">Reset password</a></p>` +
    `<p style="color:#7a6a5f;font-size:13px">This link expires in 1 hour. If you didn't request it, ignore this email.</p>` +
    `</div>`;
  return { subject, text, html };
}

// Send a password-reset email (best-effort, Resend-or-SMTP, env-gated).
export async function sendPasswordResetEmail({ name, email, resetUrl }) {
  const msg = passwordResetEmail({ name, resetUrl });
  try {
    if (isResendConfigured()) { await sendViaResend({ to: email, ...msg }); return { sent: true, via: "resend" }; }
    if (isMailConfigured()) { await sendMail({ to: email, ...msg }); return { sent: true, via: "smtp" }; }
    return { sent: false, skipped: true, reason: "No mail provider configured" };
  } catch (e) {
    return { sent: false, error: e.message };
  }
}

// Send a welcome email (best-effort). Prefers Resend (free tier), falls back to
// SMTP if that's the only thing configured. Returns a status; never throws for
// the caller — signup must succeed even if email delivery is unavailable.
export async function sendWelcomeEmail({ name, email, loginUrl }) {
  const msg = welcomeEmail({ name, loginUrl });
  try {
    if (isResendConfigured()) { await sendViaResend({ to: email, ...msg }); return { sent: true, via: "resend" }; }
    if (isMailConfigured()) { await sendMail({ to: email, ...msg }); return { sent: true, via: "smtp" }; }
    return { sent: false, skipped: true, reason: "No mail provider configured" };
  } catch (e) {
    return { sent: false, error: e.message };
  }
}
