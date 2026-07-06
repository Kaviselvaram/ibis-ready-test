// Cloudflare Turnstile (free) — env-gated on VITE_TURNSTILE_SITE_KEY. When it's
// unset, the widget renders nothing and no token is attached, so login/signup
// behave exactly as before. The current token is held here so the AuthClient can
// attach it without threading it through every layer.

export const TURNSTILE_SITE_KEY =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_TURNSTILE_SITE_KEY) || "";

export const isTurnstileEnabled = () => Boolean(TURNSTILE_SITE_KEY);

let currentToken = null;
export const setTurnstileToken = (t) => { currentToken = t; };
export const getTurnstileToken = () => currentToken;
export const clearTurnstileToken = () => { currentToken = null; };

// Loads the Turnstile script once, on demand.
let scriptPromise = null;
export function loadTurnstileScript() {
  if (typeof window !== "undefined" && window.turnstile) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve(true);
    s.onerror = () => { scriptPromise = null; resolve(false); };
    document.body.appendChild(s);
  });
  return scriptPromise;
}
