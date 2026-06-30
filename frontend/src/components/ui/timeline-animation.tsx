import { motion, useInView } from "framer-motion";
import React from "react";

interface TimelineContentProps {
  as?: any;
  animationNum: number;
  timelineRef: React.RefObject<any>;
  customVariants: any;
  className?: string;
  children?: React.ReactNode;
}

export function TimelineContent({
  as = "div",
  animationNum,
  timelineRef,
  customVariants,
  className,
  children,
  ...props
}: TimelineContentProps) {
  const isInView = useInView(timelineRef, { once: true, margin: "0px" });
  
  // Dynamically resolve motion tag (motion.span, motion.h1, etc.)
  const MotionComponent = (motion as any)[as] || motion.div;

  return (
    <MotionComponent
      variants={customVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      custom={animationNum}
      className={className}
      {...props}
    >
      {children}
    </MotionComponent>
  );
}
