import React, { createContext, useContext, useState, useMemo } from "react";

const AccessContext = createContext(null);

export const AccessProvider = ({ children }) => {
  const [access, setAccess] = useState("trial");

  return (
    <AccessContext.Provider value={useMemo(() => ({ access, setAccess }), [access])}>
      {children}
    </AccessContext.Provider>
  );
};

export const useAccessContext = () => {
  const context = useContext(AccessContext);
  if (!context) {
    throw new Error("useAccessContext must be used within an AccessProvider");
  }
  return context;
};
