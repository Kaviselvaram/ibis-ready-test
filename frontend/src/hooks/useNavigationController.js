import { useNavigate } from "react-router-dom";
import { useUI } from "../contexts/UIContext";

export const useNavigationController = () => {
  const navigate = useNavigate();
  const { pricingSource } = useUI();

  const goToAdmin = () => navigate("/admin");
  const goToWhyIbis = () => navigate("/why-ibis");
  const goToHome = () => navigate("/");
  const goToBatches = () => navigate("/admin/batches");
  const goToLegal = (page) => navigate(`/legal/${page}`);
  const goToStudentPortal = () => navigate("/student");
  const goToSignup = () => navigate("/signup");
  const goToCheckout = () => navigate("/checkout");
  const goToChapter = () => navigate("/chapter");
  const goBackFromCheckout = () => navigate(pricingSource === "landing" ? "/" : "/signup");
  const goBackFromLegal = () => navigate("/signup");

  return {
    goToAdmin,
    goToWhyIbis,
    goToHome,
    goToBatches,
    goToLegal,
    goToStudentPortal,
    goToSignup,
    goToCheckout,
    goToChapter,
    goBackFromCheckout,
    goBackFromLegal
  };
};
