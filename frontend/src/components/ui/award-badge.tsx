import React, { MouseEvent, useEffect, useRef, useState } from "react";

export type AwardBadgeType =
  | "golden-kitty"
  | "product-of-the-day"
  | "product-of-the-month"
  | "product-of-the-week"
  | "cbse-coaching"
  | "harvard-leadership";

export interface AwardBadgeProps {
  type: AwardBadgeType;
  place?: number;
  link?: string;
  variant?: "transparent" | "colored";
}

const identityMatrix =
  "1, 0, 0, 0, " +
  "0, 1, 0, 0, " +
  "0, 0, 1, 0, " +
  "0, 0, 0, 1";

const maxRotate = 0.25;
const minRotate = -0.25;
const maxScale = 1;
const minScale = 0.97;

const badgeConfig = {
  "golden-kitty": {
    subtitle: "PRODUCT HUNT",
    title: "Golden Kitty Awards",
    iconFill: "#d5a14a",
    textColor: "#201611",
    subtitleColor: "#75655a",
    bgFill: "#f3e3ac"
  },
  "product-of-the-day": {
    subtitle: "PRODUCT HUNT",
    title: "Product of the Day",
    iconFill: "#db7a59",
    textColor: "#201611",
    subtitleColor: "#75655a",
    bgFill: "#ffe2bc"
  },
  "product-of-the-month": {
    subtitle: "PRODUCT HUNT",
    title: "Product of the Month",
    iconFill: "#75655a",
    textColor: "#201611",
    subtitleColor: "#75655a",
    bgFill: "#ddd"
  },
  "product-of-the-week": {
    subtitle: "PRODUCT HUNT",
    title: "Product of the Week",
    iconFill: "#75655a",
    textColor: "#201611",
    subtitleColor: "#75655a",
    bgFill: "#f1cfa6"
  },
  "cbse-coaching": {
    subtitle: "CBSE PHYSICS MENTOR",
    title: "10+ Yrs Elite Coaching",
    iconFill: "#ffd700",
    textColor: "#ffffff",
    subtitleColor: "#ffe2bc",
    bgFill: "transparent"
  },
  "harvard-leadership": {
    subtitle: "HARVARD L&M",
    title: "Harvard Certified",
    iconFill: "#e2e8f0",
    textColor: "#ffffff",
    subtitleColor: "#cbd5e1",
    bgFill: "transparent"
  }
};

export const AwardBadge = ({ type, place, link, variant = "colored" }: AwardBadgeProps) => {
  const ref = useRef<HTMLAnchorElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const canTrackRef = useRef<boolean>(false);
  const [disableInOutOverlayAnimation, setDisableInOutOverlayAnimation] = useState<boolean>(true);
  const [disableOverlayAnimation, setDisableOverlayAnimation] = useState<boolean>(false);
  const enterTimeout = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeout1 = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeout2 = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeout3 = useRef<NodeJS.Timeout | null>(null);

  const config = badgeConfig[type] || badgeConfig["product-of-the-day"];
  const isTransparent = variant === "transparent";

  // Dynamic fills: Gold theme for CBSE, Silver theme for Harvard
  const fills = type === "harvard-leadership" ? {
    sheen1: "hsl(0, 0%, 92%)",              // Pure Platinum
    sheen2: "hsl(210, 10%, 88%)",          // Cool Silver
    sheen3: "hsl(0, 0%, 96%)",              // White Chrome
    sheen4: "rgba(255, 255, 255, 0.95)",    // Clean White Sheen
    sheen5: "hsl(210, 8%, 90%)",            // Silver
    sheen6: "rgba(255, 255, 255, 0.45)",    // White sheen
    sheen7: "hsl(210, 12%, 84%)",           // Slate Silver
    sheen8: "transparent",
    sheen9: "transparent",
    sheen10: "rgba(255, 255, 255, 0.9)"     // Pure highlights
  } : {
    sheen1: "hsl(48, 100%, 70%)",        // Bright Gold
    sheen2: "hsl(45, 100%, 65%)",        // Soft Gold
    sheen3: "hsl(52, 100%, 75%)",        // Yellow Gold
    sheen4: "rgba(255, 255, 255, 0.85)",   // Clean White
    sheen5: "hsl(48, 100%, 80%)",        // Pale Gold
    sheen6: "rgba(255, 255, 255, 0.45)",   // White sheen
    sheen7: "hsl(45, 100%, 60%)",        // Gold
    sheen8: "transparent",
    sheen9: "transparent",
    sheen10: "rgba(255, 255, 255, 0.85)" // Pure light sheen
  };

  const getDimensions = () => {
    const left = ref?.current?.getBoundingClientRect()?.left || 0;
    const right = ref?.current?.getBoundingClientRect()?.right || 0;
    const top = ref?.current?.getBoundingClientRect()?.top || 0;
    const bottom = ref?.current?.getBoundingClientRect()?.bottom || 0;

    return { left, right, top, bottom };
  };

  const getMatrix = (clientX: number, clientY: number) => {
    const { left, right, top, bottom } = getDimensions();
    const xCenter = (left + right) / 2;
    const yCenter = (top + bottom) / 2;

    const scale = [
      maxScale - (maxScale - minScale) * Math.abs(xCenter - clientX) / (xCenter - left),
      maxScale - (maxScale - minScale) * Math.abs(yCenter - clientY) / (yCenter - top),
      maxScale - (maxScale - minScale) * (Math.abs(xCenter - clientX) + Math.abs(yCenter - clientY)) / (xCenter - left + yCenter - top)
    ];

    const rotate = {
      x1: 0.25 * ((yCenter - clientY) / yCenter - (xCenter - clientX) / xCenter),
      x2: maxRotate - (maxRotate - minRotate) * Math.abs(right - clientX) / (right - left),
      x3: 0,
      y0: 0,
      y2: maxRotate - (maxRotate - minRotate) * (top - clientY) / (top - bottom),
      y3: 0,
      z0: -(maxRotate - (maxRotate - minRotate) * Math.abs(right - clientX) / (right - left)),
      z1: (0.2 - (0.2 + 0.6) * (top - clientY) / (top - bottom)),
      z3: 0
    };
    return `${scale[0]}, ${rotate.y0}, ${rotate.z0}, 0, ` +
      `${rotate.x1}, ${scale[1]}, ${rotate.z1}, 0, ` +
      `${rotate.x2}, ${rotate.y2}, ${scale[2]}, 0, ` +
      `${rotate.x3}, ${rotate.y3}, ${rotate.z3}, 1`;
  };

  const getOppositeMatrix = (_matrix: string, clientY: number, onMouseEnter?: boolean) => {
    const { top, bottom } = getDimensions();
    const oppositeY = bottom - clientY + top;
    const weakening = onMouseEnter ? 0.7 : 4;
    const multiplier = onMouseEnter ? -1 : 1;

    return _matrix.split(", ").map((item, index) => {
      if (index === 2 || index === 4 || index === 8) {
        return -parseFloat(item) * multiplier / weakening;
      } else if (index === 0 || index === 5 || index === 10) {
        return "1";
      } else if (index === 6) {
        return multiplier * (maxRotate - (maxRotate - minRotate) * (top - oppositeY) / (top - bottom)) / weakening;
      } else if (index === 9) {
        return (maxRotate - (maxRotate - minRotate) * (top - oppositeY) / (top - bottom)) / weakening;
      }
      return item;
    }).join(", ");
  };

  const onMouseEnter = (e: MouseEvent<HTMLAnchorElement>) => {
    if (leaveTimeout1.current) clearTimeout(leaveTimeout1.current);
    if (leaveTimeout2.current) clearTimeout(leaveTimeout2.current);
    if (leaveTimeout3.current) clearTimeout(leaveTimeout3.current);
    setDisableOverlayAnimation(true);

    const { left, right, top, bottom } = getDimensions();
    const xCenter = (left + right) / 2;
    const yCenter = (top + bottom) / 2;

    setDisableInOutOverlayAnimation(false);
    enterTimeout.current = setTimeout(() => setDisableInOutOverlayAnimation(true), 350);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        cardRef.current?.style.setProperty("--award-overlay", `${(Math.abs(xCenter - e.clientX) + Math.abs(yCenter - e.clientY)) / 1.5}deg`);
      });
    });

    const matrix = getMatrix(e.clientX, e.clientY);
    const oppositeMatrix = getOppositeMatrix(matrix, e.clientY, true);

    if (cardRef.current) {
      cardRef.current.style.transform = `perspective(700px) matrix3d(${oppositeMatrix})`;
    }
    canTrackRef.current = false;
    setTimeout(() => {
      canTrackRef.current = true;
    }, 200);
  };

  const onMouseMove = (e: MouseEvent<HTMLAnchorElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const { clientX, clientY } = e;
    if (rafRef.current) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const { left, right, top, bottom } = getDimensions();
      const xCenter = (left + right) / 2;
      const yCenter = (top + bottom) / 2;
      card.style.setProperty("--award-overlay", `${(Math.abs(xCenter - clientX) + Math.abs(yCenter - clientY)) / 1.5}deg`);

      if (canTrackRef.current) {
        card.style.transform = `perspective(700px) matrix3d(${getMatrix(clientX, clientY)})`;
      }
    });
  };

  const onMouseLeave = (e: MouseEvent<HTMLAnchorElement>) => {
    const card = cardRef.current;
    const currentTransform = card?.style.transform.match(/matrix3d\((.+)\)/)?.[1] || identityMatrix;
    const oppositeMatrix = getOppositeMatrix(currentTransform, e.clientY);

    if (enterTimeout.current) clearTimeout(enterTimeout.current);
    canTrackRef.current = false;

    if (card) {
      card.style.transform = `perspective(700px) matrix3d(${oppositeMatrix})`;
      setTimeout(() => {
        card.style.transform = `perspective(700px) matrix3d(${identityMatrix})`;
      }, 200);
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setDisableInOutOverlayAnimation(false);
        leaveTimeout1.current = setTimeout(() => card?.style.setProperty("--award-overlay", "-8deg"), 150);
        leaveTimeout2.current = setTimeout(() => card?.style.setProperty("--award-overlay", "0deg"), 300);
        leaveTimeout3.current = setTimeout(() => {
          setDisableOverlayAnimation(false);
          setDisableInOutOverlayAnimation(true);
        }, 500);
      });
    });
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (enterTimeout.current) clearTimeout(enterTimeout.current);
      if (leaveTimeout1.current) clearTimeout(leaveTimeout1.current);
      if (leaveTimeout2.current) clearTimeout(leaveTimeout2.current);
      if (leaveTimeout3.current) clearTimeout(leaveTimeout3.current);
    };
  }, []);

  const overlayAnimations = [...Array(10).keys()].map((e) => (
    `
    @keyframes overlayAnimation${e + 1} {
      0% {
        transform: rotate(${e * 10}deg);
      }
      50% {
        transform: rotate(${(e + 1) * 10}deg);
      }
      100% {
        transform: rotate(${e * 10}deg);
      }
    }
    `
  )).join(" ");

  const isHarvard = type === "harvard-leadership";
  const isCbse = type === "cbse-coaching";

  const bgFillColor = isTransparent
    ? (isHarvard
        ? "rgba(226, 232, 240, 0.04)"
        : isCbse
        ? "rgba(245, 158, 11, 0.03)"
        : "rgba(255, 255, 255, 0.02)")
    : config.bgFill;

  const strokeColor = isTransparent
    ? (isHarvard
        ? "rgba(226, 232, 240, 0.25)"
        : isCbse
        ? "rgba(245, 158, 11, 0.25)"
        : "rgba(255, 255, 255, 0.15)")
    : "#ccc";

  const textColor = isTransparent ? "#ffffff" : config.textColor;

  const subtitleColor = isTransparent
    ? (isHarvard
        ? "#cbd5e1"
        : isCbse
        ? "#ffe2bc"
        : config.subtitleColor)
    : config.subtitleColor;

  const iconFillColor = isTransparent
    ? (isHarvard
        ? "#f1f5f9"
        : isCbse
        ? "#ffd700"
        : config.iconFill)
    : config.iconFill;

  return (
    <a
      ref={ref}
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="award-badge-link"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onMouseEnter={onMouseEnter}
      onClick={(e) => {
        if (!link) e.preventDefault();
      }}
    >
      <style>
        {overlayAnimations}
      </style>
      <div
        ref={cardRef}
        style={{
          transform: `perspective(700px) matrix3d(${identityMatrix})`,
          transformOrigin: "center center",
          transition: "transform 200ms ease-out",
          ["--award-overlay" as string]: "0deg",
          backdropFilter: isTransparent ? "blur(12px)" : "none",
          WebkitBackdropFilter: isTransparent ? "blur(12px)" : "none",
          borderRadius: "10px",
          background: isTransparent
            ? (isHarvard
                ? "rgba(226, 232, 240, 0.16)"
                : isCbse
                ? "rgba(245, 158, 11, 0.15)"
                : "rgba(255, 255, 255, 0.12)")
            : "transparent",
          border: isTransparent
            ? (isHarvard
                ? "1px solid rgba(226, 232, 240, 0.45)"
                : isCbse
                ? "1px solid rgba(245, 158, 11, 0.4)"
                : "1px solid rgba(255, 255, 255, 0.16)")
            : "none"
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 54" className="award-badge-svg">
          <defs>
            <filter id="blur1">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
            </filter>
            <mask id="badgeMask">
              <rect width="260" height="54" fill="white" rx="10" />
            </mask>
          </defs>
          <rect width="260" height="54" rx="10" fill={bgFillColor} />
          <rect x="4" y="4" width="252" height="46" rx="8" fill="transparent" stroke={strokeColor} strokeWidth="1" />
          <text fontFamily="Plus Jakarta Sans, sans-serif" fontSize="8" fontWeight="bold" fill={subtitleColor} letterSpacing="0.08em" x="53" y="20">
            {config.subtitle}
          </text>
          <text fontFamily="Fraunces, serif" fontSize="13" fontWeight="bold" fill={textColor} x="52" y="38">
            {config.title}{place && ` #${place}`}
          </text>
          <g transform="translate(8, 9)">
            <path fill={iconFillColor}
                  d="M14.963 9.075c.787-3-.188-5.887-.188-5.887S12.488 5.175 11.7 8.175c-.787 3 .188 5.887.188 5.887s2.25-1.987 3.075-4.987m-4.5 1.987c.787 3-.188 5.888-.188 5.888S7.988 14.962 7.2 11.962c-.787-3 .188-5.887.188-5.887s2.287 1.987 3.075 4.987m.862 10.388s-.6-2.962-2.775-5.175C6.337 14.1 3.375 13.5 3.375 13.5s.6 2.962 2.775 5.175c2.213 2.175 5.175 2.775 5.175 2.775m3.3 3.413s-1.988-2.288-4.988-3.075-5.887.187-5.887.187 1.987 2.287 4.988 3.075c3 .787 5.887-.188 5.887-.188Zm6.75 0s1.988-2.288 4.988-3.075c3-.826 5.887.187 5.887.187s-1.988 2.287-4.988 3.075c-3 .787-5.887-.188-5.887-.188ZM32.625 13.5s-2.963.6-5.175 2.775c-2.213 2.213-2.775 5.175-2.775 5.175s2.962-.6 5.175-2.775c2.175-2.213 2.775-5.175 2.775-5.175M28.65 6.075s.975 2.887.188 5.887c-.826 3-3.076 4.988-3.076 4.988s-.974-2.888-.187-5.888c.788-3 3.075-4.987 3.075-4.987m-4.5 7.987s.975-2.887.188-5.887c-.788-3-3.076-4.988-3.076-4.988s-.974 2.888-.187 5.888c.788 3 3.075 4.988 3.075 4.988ZM18 26.1c.975-.225 3.113-.6 5.325 0 3 .788 5.063 3.038 5.063 3.038s-2.888.975-5.888.187a13 13 0 0 1-1.425-.525c.563.788 1.125 1.425 2.288 1.913l-.863 2.062c-2.063-.862-2.925-2.137-3.675-3.262-.262-.375-.525-.713-.787-1.05-.26.293-.465.586-.686.903l-.102.147-.048.068c-.775 1.108-1.643 2.35-3.627 3.194l-.862-2.062c1.162-.488 1.725-1.125 2.287-1.913-.45.225-.938.375-1.425.525-3 .788-5.887-.187-5.887-.187s1.987-2.288 4.987-3.075c2.212-.563 4.35-.188 5.325.037" />
          </g>
          <g style={{ mixBlendMode: "overlay" }} mask="url(#badgeMask)">
            <g style={{
              transform: "rotate(var(--award-overlay, 0deg))",
              transformOrigin: "center center",
              transition: !disableInOutOverlayAnimation ? "transform 200ms ease-out" : "none",
              animation: disableOverlayAnimation ? "none" : "overlayAnimation1 5s infinite",
              willChange: "transform"
            }}>
              <polygon points="0,0 260,54 260,0 0,54" fill={fills.sheen1} filter="url(#blur1)" opacity="0.45" />
            </g>
            <g style={{
              transform: "rotate(calc(var(--award-overlay, 0deg) + 10deg))",
              transformOrigin: "center center",
              transition: !disableInOutOverlayAnimation ? "transform 200ms ease-out" : "none",
              animation: disableOverlayAnimation ? "none" : "overlayAnimation2 5s infinite",
              willChange: "transform"
            }}>
              <polygon points="0,0 260,54 260,0 0,54" fill={fills.sheen2} filter="url(#blur1)" opacity="0.45" />
            </g>
            <g style={{
              transform: "rotate(calc(var(--award-overlay, 0deg) + 20deg))",
              transformOrigin: "center center",
              transition: !disableInOutOverlayAnimation ? "transform 200ms ease-out" : "none",
              animation: disableOverlayAnimation ? "none" : "overlayAnimation3 5s infinite",
              willChange: "transform"
            }}>
              <polygon points="0,0 260,54 260,0 0,54" fill={fills.sheen3} filter="url(#blur1)" opacity="0.45" />
            </g>
            <g style={{
              transform: "rotate(calc(var(--award-overlay, 0deg) + 30deg))",
              transformOrigin: "center center",
              transition: !disableInOutOverlayAnimation ? "transform 200ms ease-out" : "none",
              animation: disableOverlayAnimation ? "none" : "overlayAnimation4 5s infinite",
              willChange: "transform"
            }}>
              <polygon points="0,0 260,54 260,0 0,54" fill={fills.sheen4} filter="url(#blur1)" opacity="0.45" />
            </g>
            <g style={{
              transform: "rotate(calc(var(--award-overlay, 0deg) + 40deg))",
              transformOrigin: "center center",
              transition: !disableInOutOverlayAnimation ? "transform 200ms ease-out" : "none",
              animation: disableOverlayAnimation ? "none" : "overlayAnimation5 5s infinite",
              willChange: "transform"
            }}>
              <polygon points="0,0 260,54 260,0 0,54" fill={fills.sheen5} filter="url(#blur1)" opacity="0.45" />
            </g>
            <g style={{
              transform: "rotate(calc(var(--award-overlay, 0deg) + 50deg))",
              transformOrigin: "center center",
              transition: !disableInOutOverlayAnimation ? "transform 200ms ease-out" : "none",
              animation: disableOverlayAnimation ? "none" : "overlayAnimation6 5s infinite",
              willChange: "transform"
            }}>
              <polygon points="0,0 260,54 260,0 0,54" fill={fills.sheen6} filter="url(#blur1)" opacity="0.45" />
            </g>
            <g style={{
              transform: "rotate(calc(var(--award-overlay, 0deg) + 60deg))",
              transformOrigin: "center center",
              transition: !disableInOutOverlayAnimation ? "transform 200ms ease-out" : "none",
              animation: disableOverlayAnimation ? "none" : "overlayAnimation7 5s infinite",
              willChange: "transform"
            }}>
              <polygon points="0,0 260,54 260,0 0,54" fill={fills.sheen7} filter="url(#blur1)" opacity="0.45" />
            </g>
            <g style={{
              transform: "rotate(calc(var(--award-overlay, 0deg) + 70deg))",
              transformOrigin: "center center",
              transition: !disableInOutOverlayAnimation ? "transform 200ms ease-out" : "none",
              animation: disableOverlayAnimation ? "none" : "overlayAnimation8 5s infinite",
              willChange: "transform"
            }}>
              <polygon points="0,0 260,54 260,0 0,54" fill="transparent" filter="url(#blur1)" opacity="0.45" />
            </g>
            <g style={{
              transform: "rotate(calc(var(--award-overlay, 0deg) + 80deg))",
              transformOrigin: "center center",
              transition: !disableInOutOverlayAnimation ? "transform 200ms ease-out" : "none",
              animation: disableOverlayAnimation ? "none" : "overlayAnimation9 5s infinite",
              willChange: "transform"
            }}>
              <polygon points="0,0 260,54 260,0 0,54" fill="transparent" filter="url(#blur1)" opacity="0.45" />
            </g>
            <g style={{
              transform: "rotate(calc(var(--award-overlay, 0deg) + 90deg))",
              transformOrigin: "center center",
              transition: !disableInOutOverlayAnimation ? "transform 200ms ease-out" : "none",
              animation: disableOverlayAnimation ? "none" : "overlayAnimation10 5s infinite",
              willChange: "transform"
            }}>
              <polygon points="0,0 260,54 260,0 0,54" fill={fills.sheen10} filter="url(#blur1)" opacity="0.45" />
            </g>
          </g>
        </svg>
      </div>
    </a>
  );
};
