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
