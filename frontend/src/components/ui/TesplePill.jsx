import React, { useEffect, useRef } from 'react';

export default function TesplePill() {
  const hostRef = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      const el = hostRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <a
      href="https://tesple.in"
      target="_blank"
      rel="noopener noreferrer"
      ref={hostRef}
      className="yc-pill-wrapper"
      style={{
        "--mx": "50%",
        "--my": "50%",
        textDecoration: "none"
      }}
    >
      <div className="yc-pill-glow-container" aria-hidden="true">
        <div className="yc-pill-glow" />
      </div>
      <div className="yc-pill-glass">
        <div className="yc-pill-content">
          <span className="yc-monogram-wrap" aria-hidden="true">
            <img src="/ibis-assets/tesple.png?v=1" alt="Tesple Logo" className="yc-monogram-img" />
          </span>
          <span className="yc-pill-text">
            Backed by Tesple
          </span>
        </div>
      </div>
    </a>
  );
}

