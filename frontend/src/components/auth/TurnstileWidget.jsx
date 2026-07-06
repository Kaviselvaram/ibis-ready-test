import React, { useEffect, useRef } from "react";
import {
  isTurnstileEnabled, TURNSTILE_SITE_KEY, loadTurnstileScript,
  setTurnstileToken, clearTurnstileToken
} from "../../utils/turnstile";

// Renders the Cloudflare Turnstile widget only when configured (site key set).
// When not configured it renders nothing, so the auth card layout is unchanged.
export default function TurnstileWidget() {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    if (!isTurnstileEnabled()) return;
    let mounted = true;
    loadTurnstileScript().then((ok) => {
      if (!ok || !mounted || !window.turnstile || !containerRef.current) return;
      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: "light",
          size: "flexible",
          callback: (token) => setTurnstileToken(token),
          "expired-callback": () => clearTurnstileToken(),
          "error-callback": () => clearTurnstileToken()
        });
      } catch { /* already rendered */ }
    });
    return () => {
      mounted = false;
      try { if (window.turnstile && widgetIdRef.current) window.turnstile.remove(widgetIdRef.current); } catch { /* no-op */ }
      clearTurnstileToken();
    };
  }, []);

  if (!isTurnstileEnabled()) return null;
  return <div className="turnstile-widget" ref={containerRef} aria-label="Human verification" />;
}
