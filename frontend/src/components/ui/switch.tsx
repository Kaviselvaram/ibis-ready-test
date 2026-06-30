import React, { useState } from "react";

type PatternType =
  | "conic"
  | "linear"
  | "dots"
  | "grid"
  | "zigzag"
  | "waves"
  | "cross"
  | "checker"
  | "hex"
  | "bricks"
  | "triangles"
  | "stars"
  | "rings"
  | "plaid"
  | "honeycomb"
  | "plus";

interface ShamayimToggleSwitchProps {
  defaultState: boolean;
  mirrored?: boolean;
  onChange: (isOn: boolean) => void;
  trackBg?: string;
  trackShadow?: string;
  buttonBg?: string;
  buttonShadow?: string;
  buttonBeforeBg?: string;
  buttonAfterBg?: string;
  pattern?: PatternType;
}

const defaultColors = {
  trackBg: "repeating-conic-gradient(#8a3928 0% 25%, #d37150 0% 50%)",
  trackShadow:
    "inset 0 .125em .25em rgba(32, 22, 17, .6), inset -1.5em 0 .0625em rgba(32, 22, 17, .5), inset .5em 0 .5em rgba(32, 22, 17, .5), 0 1px 1px rgba(255, 255, 255, 0.2)",
  buttonBg: "linear-gradient(to right, #ffe2bc, #8a3928)",
  buttonShadow: "0 .125em .25em rgba(0, 0, 0, 0.4)",
  buttonBeforeBg: "linear-gradient(to right, #8a3928, #d37150, #ffe2bc)",
  buttonAfterBg:
    "repeating-linear-gradient(to right, #ffe2bc 0 .0625em, #d37150 .0625em .125em, transparent .125em .1875em)",
};

const patternPresets: Record<PatternType, { trackBg: string; backgroundSize?: string; backgroundPosition?: string }> = {
  conic: {
    trackBg: "repeating-conic-gradient(#8a3928 0deg 18deg, #d37150 18deg 36deg)",
    backgroundSize: "18px 18px",
  },
  linear: {
    trackBg: "repeating-linear-gradient(135deg, #8a3928 0 2px, #d37150 2px 4px)",
    backgroundSize: "8px 8px",
  },
  dots: {
    trackBg:
      "radial-gradient(circle at 2px 2px, #d37150 1.5px, transparent 0), radial-gradient(circle at 6px 6px, #8a3928 1.5px, transparent 0)",
    backgroundSize: "8px 8px",
  },
  grid: {
    trackBg:
      "linear-gradient(#d37150 1.5px, transparent 1.5px), linear-gradient(90deg, #d37150 1.5px, transparent 1.5px)",
    backgroundSize: "8px 8px",
  },
  zigzag: {
    trackBg:
      "repeating-linear-gradient(135deg, #d37150 0 2px, transparent 2px 4px), repeating-linear-gradient(-135deg, #8a3928 0 2px, transparent 2px 4px)",
    backgroundSize: "8px 8px",
  },
  waves: {
    trackBg:
      "repeating-radial-gradient(circle at 0 8px, #d37150 0 1px, transparent 1px 8px)",
    backgroundSize: "16px 16px",
  },
  cross: {
    trackBg:
      "linear-gradient(90deg, #8a3928 1px, transparent 1px), linear-gradient(#d37150 1px, transparent 1px)",
    backgroundSize: "6px 6px",
  },
  checker: {
    trackBg:
      "linear-gradient(45deg, #8a3928 25%, transparent 25%, transparent 75%, #8a3928 75%, #8a3928), linear-gradient(45deg, #8a3928 25%, transparent 25%, transparent 75%, #8a3928 75%, #8a3928)",
    backgroundSize: "8px 8px",
    backgroundPosition: "0 0, 4px 4px",
  },
  hex: {
    trackBg:
      "radial-gradient(circle, #8a3928 2px, transparent 2.5px), radial-gradient(circle, #d37150 2px, transparent 2.5px)",
    backgroundSize: "12px 13.86px",
    backgroundPosition: "0 0, 6px 6.93px",
  },
  bricks: {
    trackBg:
      "repeating-linear-gradient(0deg, #d37150 0 4px, transparent 4px 8px), repeating-linear-gradient(90deg, #8a3928 0 8px, transparent 8px 16px)",
    backgroundSize: "16px 8px",
    backgroundPosition: "0 0, 8px 4px",
  },
  triangles: {
    trackBg:
      "repeating-linear-gradient(135deg, #d37150 0 4px, transparent 4px 8px), repeating-linear-gradient(-135deg, #8a3928 0 4px, transparent 4px 8px)",
    backgroundSize: "8px 8px",
  },
  stars: {
    trackBg:
      "radial-gradient(circle at 2px 2px, #d37150 1px, transparent 1.5px), radial-gradient(circle at 6px 6px, #8a3928 1px, transparent 1.5px)",
    backgroundSize: "8px 8px",
  },
  rings: {
    trackBg:
      "repeating-radial-gradient(circle, #d37150 0 1px, transparent 1px 4px)",
    backgroundSize: "16px 16px",
  },
  plaid: {
    trackBg:
      "repeating-linear-gradient(0deg, #d37150 0 2px, transparent 2px 8px), repeating-linear-gradient(90deg, #8a3928 0 2px, transparent 2px 8px)",
    backgroundSize: "8px 8px",
  },
  honeycomb: {
    trackBg:
      "radial-gradient(circle, #8a3928 2px, transparent 2.5px), radial-gradient(circle, #d37150 2px, transparent 2.5px)",
    backgroundSize: "12px 10.4px",
    backgroundPosition: "0 0, 6px 5.2px",
  },
  plus: {
    trackBg:
      "linear-gradient(90deg, #8a3928 1px, transparent 1px), linear-gradient(#d37150 1px, transparent 1px)",
    backgroundSize: "8px 8px",
  },
};

export const ShamayimToggleSwitch: React.FC<ShamayimToggleSwitchProps> = ({
  defaultState,
  mirrored = false,
  onChange,
  trackBg,
  trackShadow,
  buttonBg,
  buttonShadow,
  buttonBeforeBg,
  buttonAfterBg,
  pattern = "conic",
}) => {
  const [isOn, setIsOn] = useState(defaultState);

  // Pick pattern preset or fallback to default
  const preset = patternPresets[pattern] || patternPresets.conic;

  const patternTrackBg = trackBg || preset.trackBg || defaultColors.trackBg;
  const patternBackgroundSize = preset.backgroundSize || "16px 16px";
  const patternBackgroundPosition = preset.backgroundPosition || "0 0";

  const handleToggle = () => {
    const newState = !isOn;
    setIsOn(newState);
    onChange(newState);
  };

  const cssVariables = {
    "--button-before-bg": buttonBeforeBg || defaultColors.buttonBeforeBg,
    "--button-after-bg": buttonAfterBg || defaultColors.buttonAfterBg,
  } as React.CSSProperties;

  return (
    <div
      className="toggle-wrapper"
      style={{
        transform: mirrored ? "scaleX(-1)" : "none",
        ...cssVariables,
      }}
    >
      <input
        className="toggle-checkbox"
        type="checkbox"
        checked={isOn}
        onChange={handleToggle}
      />
      <div
        className="toggle-container"
        style={{
          backgroundImage: patternTrackBg,
          backgroundSize: patternBackgroundSize,
          backgroundPosition: patternBackgroundPosition,
          boxShadow: trackShadow || defaultColors.trackShadow,
        }}
      >
        <div
          className="toggle-button"
          style={{
            backgroundImage: buttonBg || defaultColors.buttonBg,
            boxShadow: buttonShadow || defaultColors.buttonShadow,
          }}
        ></div>
      </div>
    </div>
  );
};
