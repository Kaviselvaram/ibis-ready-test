import { useNavigationController } from "./useNavigationController";
import { useAuthenticationController } from "./useAuthenticationController";
import { useAccessContext } from "../contexts/AccessContext";
import { useUI } from "../contexts/UIContext";
import { useAuthContext } from "../contexts/AuthContext";


export const useAccessController = () => {
  const { setAccess } = useAccessContext();
  const { setPaywall, setPricingSource } = useUI();
  const { goToStudentPortal, goToCheckout, goToSignup, goToAdmin } = useNavigationController();
  const { signOut } = useAuthenticationController();

  const { user } = useAuthContext();

  const enterPortal = (mode, overrideUser = null) => {
    setAccess(mode);
    setPaywall(false);
    const activeUser = overrideUser || user;
    console.log("DEBUG_ENTER_PORTAL", { overrideUser, user, activeUser });
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
