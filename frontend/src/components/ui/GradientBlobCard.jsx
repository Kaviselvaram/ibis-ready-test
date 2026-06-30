import React from 'react';

export default function GradientBlobCard({ children, className = "", onClick }) {
  const rootProps = {
    className: `blob-card ${className}`,
    onClick
  };
  
  if (onClick) {
    rootProps.style = { cursor: "pointer" };
  }

  return (
    <div {...rootProps}>
      <div className="blob-container">
        <div className="blob-bg blob-1" />
        <div className="blob-bg blob-2" />
      </div>
      <div className="blob-glass" />
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}

