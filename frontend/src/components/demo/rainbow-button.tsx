import React from "react";
import { cn } from "../../lib/utils";

interface RainbowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export const RainbowButton: React.FC<RainbowButtonProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <button
      className={cn("rainbow-border-container", className)}
      {...props}
    >
      <span className="rainbow-border-inner">
        {children}
      </span>
    </button>
  );
};

export default RainbowButton;
