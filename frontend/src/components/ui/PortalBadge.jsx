import React, { useEffect, useRef } from 'react';

export default function PortalBadge() {
  const badgeRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleMove = (event) => {
    const node = badgeRef.current;
    if (!node) return;
    const { clientX, clientY } = event;
    if (rafRef.current) return;

    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = 0;
      const rect = node.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width - 0.5;
      const y = (clientY - rect.top) / rect.height - 0.5;
      node.style.transform = `perspective(700px) rotateX(${-y * 7}deg) rotateY(${x * 8}deg) scale(0.99)`;
      node.style.setProperty("--badge-overlay", `${(Math.abs(x) + Math.abs(y)) * 48}deg`);
      node.style.setProperty("--mx", `${((clientX - rect.left) / rect.width) * 100}%`);
      node.style.setProperty("--my", `${((clientY - rect.top) / rect.height) * 100}%`);
    });
  };

  const handleLeave = () => {
    const node = badgeRef.current;
    if (!node) return;
    node.style.transform = "perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)";
    node.style.setProperty("--badge-overlay", "0deg");
    node.style.setProperty("--mx", "50%");
    node.style.setProperty("--my", "50%");
  };

  return (
    <div
      ref={badgeRef}
      className="portal-award-badge"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        transform: "perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)",
        "--badge-overlay": "0deg",
        "--mx": "50%",
        "--my": "50%"
      }}
      aria-label="12th Physics Portal"
    >
      <span className="portal-badge-sheen" aria-hidden="true" />
      <span className="portal-badge-mark" aria-hidden="true">
        <svg viewBox="0 0 36 36" role="presentation" focusable="false">
          <path
            d="M14.963 9.075c.787-3-.188-5.887-.188-5.887S12.488 5.175 11.7 8.175c-.787 3 .188 5.887.188 5.887s2.25-1.987 3.075-4.987m-4.5 1.987c.787 3-.188 5.888-.188 5.888S7.988 14.962 7.2 11.962c-.787-3 .188-5.887.188-5.887s2.287 1.987 3.075 4.987m.862 10.388s-.6-2.962-2.775-5.175C6.337 14.1 3.375 13.5 3.375 13.5s.6 2.962 2.775 5.175c2.213 2.175 5.175 2.775 5.175 2.775m3.3 3.413s-1.988-2.288-4.988-3.075-5.887.187-5.887.187 1.987 2.287 4.988 3.075c3 .787 5.887-.188 5.887-.188Zm6.75 0s1.988-2.288 4.988-3.075c3-.826 5.887.187 5.887.187s-1.988 2.287-4.988 3.075c-3 .787-5.887-.188-5.887-.188ZM32.625 13.5s-2.963.6-5.175 2.775c-2.213 2.213-2.775 5.175-2.775 5.175s2.962-.6 5.175-2.775c2.175-2.213 2.775-5.175 2.775-5.175M28.65 6.075s.975 2.887.188 5.887c-.826 3-3.076 4.988-3.076 4.988s-.974-2.888-.187-5.888c.788-3 3.075-4.987 3.075-4.987m-4.5 7.987s.975-2.887.188-5.887c-.788-3-3.076-4.988-3.076-4.988s-.974 2.888-.187 5.888c.788 3 3.075 4.988 3.075 4.988ZM18 26.1c.975-.225 3.113-.6 5.325 0 3 .788 5.063 3.038 5.063 3.038s-2.888.975-5.888.187a13 13 0 0 1-1.425-.525c.563.788 1.125 1.425 2.288 1.913l-.863 2.062c-2.063-.862-2.925-2.137-3.675-3.262-.262-.375-.525-.713-.787-1.05-.26.293-.465.586-.686.903l-.102.147-.048.068c-.775 1.108-1.643 2.35-3.627 3.194l-.862-2.062c1.162-.488 1.725-1.125 2.287-1.913-.45.225-.938.375-1.425.525-3 .788-5.887-.187-5.887-.187s1.987-2.288 4.987-3.075c2.212-.563 4.35-.188 5.325.037"
            fill="currentColor"
          />
        </svg>
      </span>
      <span className="portal-badge-title">12th Physics Portal</span>
      <span className="portal-badge-hologram" aria-hidden="true" />
    </div>
  );
}

