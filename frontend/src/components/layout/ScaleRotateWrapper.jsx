import React from "react";
import { Check, Smartphone } from "lucide-react";

/**
 * Outermost layout frame.
 *
 * This project uses vanilla CSS (no Tailwind), so all styling here is real CSS
 * via inline styles. The app's individual screens are responsive (clamp() + vh
 * units) and manage their own internal scrolling per the project layout rules,
 * so the frame's only job is to provide a clean full-viewport container and,
 * on portrait phones/tablets, a "rotate device" gate.
 */
export const ScaleRotateWrapper = ({ children, needsScale, isPortrait, isEmbedded }) => {
  // Portrait handheld devices: the experience is widescreen-first, so ask the
  // user to rotate. Skipped when embedded (host page controls the viewport).
  if (isPortrait && !isEmbedded) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#0f0d0c",
          color: "#fff",
          textAlign: "center",
          overflow: "hidden",
          zIndex: 50,
        }}
      >
        <div style={{ maxWidth: "360px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "22px" }}>
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #f43f5e, #f59e0b)",
              }}
            >
              <Smartphone size={32} style={{ color: "#fff", transform: "rotate(90deg)" }} />
            </div>
          </div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.01em" }}>
            Rotate Device
          </h2>
          <p style={{ color: "rgba(255,255,255,0.62)", fontSize: "0.95rem", lineHeight: 1.6, margin: "0 0 22px" }}>
            Ibis Physics is designed for immersive widescreen learning. Please rotate your device to landscape mode.
          </p>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              fontSize: "0.78rem",
              color: "rgba(255,255,255,0.8)",
            }}
          >
            <Check size={14} style={{ color: "#34d399" }} />
            <span>Orientation Lock Recommended</span>
          </div>
        </div>
      </div>
    );
  }

  // Default: a transparent, full-viewport container. `needsScale` (small or
  // touch viewports) is intentionally handled by the responsive CSS of each
  // screen rather than a fixed-canvas transform, so layouts stack/scroll
  // cleanly instead of being letterboxed.
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </div>
  );
};
