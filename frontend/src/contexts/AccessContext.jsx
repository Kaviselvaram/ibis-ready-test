import React, { createContext, useContext, useMemo } from "react";
import { useAuthContext } from "./AuthContext";

const AccessContext = createContext(null);

// Access is derived purely from the authenticated user's real claims
// (issued by the backend in the JWT). Nothing is hardcoded or set manually:
//  - admins always have full access
//  - a 'pro' plan with a valid (non-expired) paid_until is full access
//  - everyone else is on the trial tier
const computeAccess = (user) => {
  if (!user) return "trial";
  if (user.role === "admin") return "full";
  const notExpired = !user.paid_until || user.paid_until * 1000 > Date.now();
  return user.plan === "pro" && notExpired ? "full" : "trial";
};

export const AccessProvider = ({ children }) => {
  const { user } = useAuthContext();
  const access = useMemo(() => computeAccess(user), [user]);

  return (
    <AccessContext.Provider value={useMemo(() => ({ access }), [access])}>
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
