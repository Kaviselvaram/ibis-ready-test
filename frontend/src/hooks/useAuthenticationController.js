let initPromise = null;

import { useEffect } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { AuthenticationRepository } from "../repositories/AuthenticationRepository";
import { useNavigationController } from "./useNavigationController";

export const useAuthenticationController = () => {
  const { user, setUser, loading, setLoading, isSignedIn, isConfigured } = useAuthContext();
  const { goToStudentPortal, goToHome } = useNavigationController();


  const initializeSession = async () => {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      setLoading(true);
      const activeUser = await AuthenticationRepository.refreshSession();
      setUser(activeUser);
      setLoading(false);
      // If refreshSession fails due to network error, it might return null.
      // But AuthenticationRepository currently swallows network errors for refreshSession and returns null.
      // We assume null means either expired or failed. 
      // To strictly allow retries after network errors, if it's null, we allow another attempt.
      if (!activeUser) initPromise = null;
    })();
    return initPromise;
  };

  const signIn = async (email, password) => {
    const authenticatedUser = await AuthenticationRepository.signIn(email, password);
    setUser(authenticatedUser);
    return authenticatedUser;
  };

  const signUp = async (email, password, metadata) => {
    const newUser = await AuthenticationRepository.signUp(email, password, metadata);
    if (newUser) {
      return await signIn(email, password);
    }
    return null;
  };

  const signOut = async () => {
    await AuthenticationRepository.signOut();
    setUser(null);
    goToHome();
  };

  // Re-issues the JWT from the live DB (plan/role/subscription recomputed
  // server-side) and updates the user. Used to keep tier/access in sync when an
  // admin changes a student's plan directly in the database. Never signs the
  // user out on a transient failure (returns null → keep current session).
  const resyncSession = async () => {
    const activeUser = await AuthenticationRepository.refreshSession();
    if (activeUser) setUser(activeUser);
    return activeUser;
  };

  return {
    user,
    loading,
    isSignedIn,
    isConfigured,
    signIn,
    signUp,
    signOut,
    resyncSession,
    initializeSession
  };
};
