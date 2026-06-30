import React, { useRef } from 'react';
import { Eye } from 'lucide-react';
import { motion } from 'framer-motion';

export function Brand({ admin = false, compact = false }) {
  return (
    <div className={`brand ${compact ? "compact" : ""}`}>
      <img className="brand-logo" src="/ibis-assets/logo.webp?v=20260626" alt="Ibis Physics" decoding="async" />
      <span>
        {admin && <small>Admin Control</small>}
      </span>
    </div>
  );
}

export function Button({ children, variant = "secondary", className = "", ...props }) {
  return (
    <button className={`btn ${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function GlassButton({ className = "", children, size = "default", contentClassName = "", onClick, ...props }) {
  const handleWrapperClick = (e) => {
    const button = e.currentTarget.querySelector("button");
    if (button && !button.contains(e.target)) {
      button.click();
    }
  };

  const sizeClass = size === "sm" ? "glass-btn-size-sm" : size === "lg" ? "glass-btn-size-lg" : size === "icon" ? "glass-btn-size-icon" : "glass-btn-size-default";

  return (
    <div className={`glass-button-wrap cursor-pointer rounded-full relative ${className}`} onClick={handleWrapperClick}>
      <button className="glass-button relative z-10" onClick={onClick} {...props}>
        <span className={`glass-button-text relative block select-none tracking-tighter ${sizeClass} ${contentClassName}`}>{children}</span>
      </button>
      <div className="glass-button-shadow rounded-full pointer-events-none"></div>
    </div>
  );
}

export function Pill({ children, tone = "neutral" }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

export function ShinyButton({ children, onClick, className = "", ...props }) {
  return (
    <button className={`shiny-cta ${className}`} onClick={onClick} {...props}>
      <span>{children}</span>
    </button>
  );
}

export default function AnimatedLayerButton({ children, hoverText, onClick, className = "", ...props }) {
  return (
    <button className={`animated-layer-btn ${hoverText ? "has-hover-label" : ""} ${className}`} onClick={onClick} {...props}>
      <svg
        viewBox="0 0 1095.66 1095.63"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path fill="#242021" d="M1298,749.62c.4,300.41-243,548-548.1,547.9C446.23,1297.4,201.92,1051.2,202.29,749c.37-301.52,244.49-547.41,548.34-547.12C1055.43,202.18,1298.25,449.6,1298,749.62Z" transform="translate(-202.29 -201.89)"/>
        <path fill="#d37150" d="M1285.89,749.79c-.25,297.07-241.24,535.86-536.12,535.66-296.34-.21-537-241.72-535.29-539,1.68-293.16,240.83-534.18,539.15-532.37C1046.8,215.84,1285.62,453.88,1285.89,749.79Z" transform="translate(-202.29 -201.89)"/>
        <path fill="#fefefe" d="M1195.29,749.56c.54,244.73-198.67,446.2-446.87,445.33C503.27,1194,304,994.53,304.93,748c.91-244.52,199.12-443.08,444.39-443.49C997.43,304,1195.74,505.59,1195.29,749.56Z" transform="translate(-202.29 -201.89)"/>
        <path fill="#db7a59" d="M1097.23,749.87c.22,190.31-154.42,347.43-348,346.92-192-.5-346.48-156.44-346.17-347.7C403.33,558,558.18,402,751.08,402.55,944.62,403.09,1097.69,560.56,1097.23,749.87Z" transform="translate(-202.29 -201.89)"/>
      </svg>
      <span className="animated-layer-label">
        <span className="label-default">{children}</span>
        {hoverText && <span className="label-hover">{hoverText}</span>}
      </span>
    </button>
  );
}

