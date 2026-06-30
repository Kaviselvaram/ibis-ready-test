import React, { useEffect, useRef } from "react";
import "katex/dist/katex.min.css";
import renderMathInElement from "katex/dist/contrib/auto-render.mjs";

export default function LatexDocument({ title, source, compact }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      renderMathInElement(containerRef.current, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\[", right: "\\]", display: true },
          { left: "\\(", right: "\\)", display: false }
        ]
      });
    }
  }, [source]);

  return (
    <div className={`latex-document ${compact ? 'compact' : ''}`}>
      {title && <h3 className="latex-title">{title}</h3>}
      <div ref={containerRef} className="latex-content" style={{ whiteSpace: "pre-wrap" }}>
        {source}
      </div>
    </div>
  );
}
