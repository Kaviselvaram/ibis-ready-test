import React from "react";
import { useViewport } from "../../hooks/useViewport";
import { AnimatedMeshBackground } from "./AnimatedMeshBackground";
import { ScaleRotateWrapper } from "./ScaleRotateWrapper";

export const AppLayout = ({ children }) => {
  const { isPortrait, needsScale, isEmbedded } = useViewport();
  const showBackground = isEmbedded || !needsScale;

  return (
    <main>
      {showBackground && <AnimatedMeshBackground />}
      <ScaleRotateWrapper
        needsScale={needsScale}
        isPortrait={isPortrait}
        isEmbedded={isEmbedded}
      >
        {children}
      </ScaleRotateWrapper>
    </main>
  );
};
