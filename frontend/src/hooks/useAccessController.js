import { useNavigationController } from "./useNavigationController";
import { useAuthenticationController } from "./useAuthenticationController";
import { useUI } from "../contexts/UIContext";
import { useAuthContext } from "../contexts/AuthContext";


export const useAccessController = () => {
  const { setPaywall, setPricingSource } = useUI();
  const { goToStudentPortal, goToCheckout, goToSignup, goToAdmin } = useNavigationController();
  const { signOut } = useAuthenticationController();

  const { user } = useAuthContext();

  // Access tier is derived from the authenticated user (see AccessContext);
  // entering the portal is purely navigation now.
  const enterPortal = (mode, overrideUser = null) => {
    setPaywall(false);
    const activeUser = overrideUser || user;
    if (activeUser?.role === 'admin') {
      goToAdmin();
    } else {
      goToStudentPortal();
    }
  };

  const handleLogoutAction = async () => {
    await signOut();
    
  };

  const initiateCheckout = (source) => {
    setPricingSource(source);
    goToCheckout();
  };

  const initiateSignup = (source) => {
    setPricingSource(source);
    goToSignup();
  };

  return { enterPortal, handleLogoutAction, initiateCheckout, initiateSignup };
};
