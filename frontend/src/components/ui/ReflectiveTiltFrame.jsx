import React, { useEffect, useRef } from 'react';

export default function ReflectiveTiltFrame({ children, className = "", featured = false }) {
  const frameRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleMove = (event) => {
    const node = frameRef.current;
    if (!node) return;
    const { clientX, clientY } = event;
    if (rafRef.current) return;

    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = 0;
      const rect = node.getBoundingClientRect();
      const relX = (clientX - rect.left) / rect.width - 0.5;
      const relY = (clientY - rect.top) / rect.height - 0.5;
      const rotateX = (-relY * 0.16).toFixed(4);
      const rotateY = (relX * 0.16).toFixed(4);
      const rotateZ = (relX * 0.035).toFixed(4);
      node.style.transform = `perspective(900px) matrix3d(1, 0, ${rotateY}, 0, ${rotateZ}, 1, ${rotateX}, 0, ${-rotateY}, ${-rotateX}, 1, 0, 0, 0, 0, 1)`;
      node.style.setProperty("--glare-x", `${Math.round((clientX - rect.left) / rect.width * 100)}%`);
      node.style.setProperty("--glare-y", `${Math.round((clientY - rect.top) / rect.height * 100)}%`);
      node.style.setProperty("--glare-opacity", "1");
    });
  };

  const handleLeave = () => {
    const node = frameRef.current;
    if (!node) return;
    node.style.transform = "perspective(900px) matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)";
    node.style.setProperty("--glare-opacity", "0");
  };

  return (
    <div
      ref={frameRef}
      className={`reflective-plan-frame ${featured ? "featured" : ""} ${className}`}
      onMouseMove={handleMove}
      onMouseEnter={() => frameRef.current?.style.setProperty("--glare-opacity", "1")}
      onMouseLeave={handleLeave}
      style={{
        transform: "perspective(900px) matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)",
        "--glare-x": "50%",
        "--glare-y": "18%",
        "--glare-opacity": 0
      }}
    >
      <div className="reflective-plan-card">
        <span className="pricing-reflect pricing-reflect-1" />
        <span className="pricing-reflect pricing-reflect-2" />
        <span className="pricing-reflect pricing-reflect-3" />
        <span className="pricing-reflect pricing-reflect-4" />
        <span className="pricing-reflect pricing-reflect-5" />
        <div className="reflective-plan-content">
          {children}
        </div>
      </div>
    </div>
  );
}

