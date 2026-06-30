import React, { createContext, useContext, useState, useMemo } from "react";

const UIContext = createContext(null);

export const UIProvider = ({ children }) => {
  const [pricingSource, setPricingSource] = useState("signup");
  const [batchOpen, setBatchOpen] = useState(false);
  const [paywall, setPaywall] = useState(false);

  return (
    <UIContext.Provider
      value={useMemo(() => ({
        pricingSource,
        setPricingSource,
        batchOpen,
        setBatchOpen,
        paywall,
        setPaywall,
      }), [pricingSource, batchOpen, paywall])}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
};
