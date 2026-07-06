// Cloudflare Turnstile server-side verification (free). Fully env-gated: when
// TURNSTILE_SECRET_KEY is unset the check is a no-op, so login/signup work
// exactly as before. Once the secret is set, a valid token is required.

export const isTurnstileEnabled = () => Boolean(process.env.TURNSTILE_SECRET_KEY);

export async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;       // dormant — not configured
  if (!token) return false;       // enabled but no token → reject
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: ip || "" })
    });
    const data = await res.json().catch(() => ({ success: false }));
    return Boolean(data.success);
  } catch {
    return false;
  }
}
