import { useState, useEffect, useMemo } from "react";

const isMobileOrTablet = typeof navigator !== "undefined" && (
  /Mobi|Android|iPhone|iPad|Macintosh/i.test(navigator.userAgent) && 
  (navigator.maxTouchPoints > 0 || (navigator.userAgent.includes("Macintosh") && "ontouchend" in document))
);

export const useViewport = () => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [needsScale, setNeedsScale] = useState(false);

  const isEmbedded = useMemo(() => {
    return new URLSearchParams(window.location.search).get("embedded") === "true";
  }, []);

  useEffect(() => {
    if (isEmbedded) return;
    const handleResize = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      setIsPortrait(H > W);
      setNeedsScale(isMobileOrTablet || H > W || W < 1280 || H < 720);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [isEmbedded]);

  return { isPortrait, needsScale, isEmbedded };
};
