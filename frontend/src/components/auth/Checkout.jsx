import { useAuthContext } from "../../contexts/AuthContext";
import { useUI } from "../../contexts/UIContext";
import { useAccessController } from "../../hooks/useAccessController";
import { useNavigationController } from "../../hooks/useNavigationController";
import { useAuthenticationController } from "../../hooks/useAuthenticationController";
import { useToast, friendlyMessage } from "../../contexts/ToastContext";
import { CourseRepository } from "../../repositories/CourseRepository";
import { PaymentRepository } from "../../repositories/PaymentRepository";
import { loadRazorpay } from "../../utils/razorpay";
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Check, Lock, GraduationCap } from 'lucide-react';
import { Brand, Button, GlassButton, Pill } from '../ui/LegacyUI';
import ReflectiveTiltFrame from '../ui/ReflectiveTiltFrame';
import TesplePill from '../ui/TesplePill';

const ToggleSwitch = ({ enabled, onChange, label, isDark }) => (
  <label className={`pricing-addon ${isDark ? "dark" : ""} ${enabled ? "on" : ""}`}>
    <input type="checkbox" checked={enabled} onChange={(e) => onChange(e.target.checked)} />
    <span className="pricing-addon-box"><Check size={13} strokeWidth={3} /></span>
    <span className="pricing-addon-label">{label}</span>
  </label>
);

const LightCheckIcon = ({ className }) => <Check size={16} className={className} color="#1f7a4d" />;
const DarkCheckIcon = ({ className }) => <Check size={16} className={className} color="#45b87e" />;
const AcademicHatIcon = () => <GraduationCap size={18} />;

export default function Checkout() {
  const { pricingSource } = useUI();
  const { enterPortal } = useAccessController();
  const { goBackFromCheckout, goToSignup } = useNavigationController();
  const { isSignedIn } = useAuthContext();
  const { user } = useAuthenticationController();
  const toast = useToast();

  const onBack = goBackFromCheckout;

  // Pricing comes from the backend (nothing hardcoded here).
  const [pricing, setPricing] = useState(null);
  const [comingSoon, setComingSoon] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    CourseRepository.getPricing()
      .then((data) => { if (active) setPricing(data); })
      .catch((e) => console.error("Failed to load pricing:", e));
    return () => { active = false; };
  }, []);

  const [starterFast, setStarterFast] = useState(false);
  const [proFast, setProFast] = useState(false);

  // Real Razorpay checkout. Falls back to "Coming soon" when payments are not
  // configured on the server (pricing.available === false).
  const startPayment = async (planId, withAddon) => {
    if (!pricing?.available) { setComingSoon(true); return; }
    if (!isSignedIn) { goToSignup(); return; }   // must have an account to pay
    if (busy) return;
    setBusy(true);
    try {
      const order = await PaymentRepository.createOrder(planId, withAddon);
      const ready = await loadRazorpay();
      if (!ready || !window.Razorpay) throw new Error("Could not load the payment gateway. Check your connection.");

      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "Ibis Physics",
        description: `${order.planName} plan`,
        prefill: { email: user?.email || "" },
        theme: { color: "#c95f42" },
        modal: { ondismiss: () => setBusy(false) },
        handler: async (resp) => {
          try {
            await PaymentRepository.verify({
              orderId: order.orderId,
              paymentId: resp.razorpay_payment_id,
              signature: resp.razorpay_signature,
              planId,
              addon: withAddon
            });
            toast.success("Payment successful — unlocking full access…");
            setTimeout(() => { window.location.href = "/student"; }, 900);
          } catch (e) {
            setBusy(false);
            toast.error(friendlyMessage(e, "Payment verification failed. If you were charged, contact support."));
          }
        }
      });
      rzp.on("payment.failed", () => { setBusy(false); toast.error("Payment failed. Please try again."); });
      rzp.open();
    } catch (e) {
      setBusy(false);
      toast.error(friendlyMessage(e, "Couldn’t start the payment. Please try again."));
    }
  };

  const starterPlan = pricing?.plans?.find((p) => p.id === "starter");
  const proPlan = pricing?.plans?.find((p) => p.id === "pro");
  const starterPrice = (starterPlan?.price || 0) + (starterFast ? (starterPlan?.addon?.price || 0) : 0);
  const proPrice = (proPlan?.price || 0) + (proFast ? (proPlan?.addon?.price || 0) : 0);

  // Feature lists come from the admin-editable pricing config (backend).
  const starterFeatures = starterPlan?.features || [];
  const proFeatures = proPlan?.features || [];

  return (
    <section className="checkout-flow">
      {/* Top Bar Navigation & Logo */}
      <div className="checkout-top-bar">
        <GlassButton 
          type="button" 
          size="icon" 
          className="pricing-back" 
          aria-label="Back" 
          onClick={onBack}
        >
          <ArrowLeft size={18} />
        </GlassButton>
        <Brand compact />
      </div>

      <div className="checkout-content-wrapper">
        {/* Main Page Title */}
        <div className="pricing-heading">
          <h1>
            Choose Your <span>Perfect</span> Plan
          </h1>
          <p>
            Select the perfect access level to master physics with interactive simulations and structured learning.
          </p>
          {comingSoon && (
            <div className="pricing-coming-soon" role="status">
              <Lock size={15} />
              <span>Online payments are opening soon — enrolment will be available shortly. Thanks for your patience!</span>
            </div>
          )}
        </div>

      {/* Cards grid — gated on loaded pricing so the real prices render
          immediately (no ₹0 → ₹price flash). A skeleton shows while it loads. */}
      {!pricing ? (
        <div className="pricing-skeleton-grid" aria-hidden="true">
          <div className="pricing-skeleton-card" />
          <div className="pricing-skeleton-card dark" />
        </div>
      ) : (
      <div className="pricing-stolen-grid">
        {/* Starter Card (1-Month Access) */}
        <div className="pricing-stolen-card-light">
          <div className="pricing-stolen-inner-light">
            <div className="pricing-stolen-header">
              <div className="pricing-stolen-title-area">
                <h2>{starterPlan?.name || "1-Month"}</h2>
                <p>Perfect for trying out Ibis Portal chapters.</p>
              </div>
              {starterPlan?.badge && (
                <span className="pricing-stolen-badge">{starterPlan.badge}</span>
              )}
            </div>

            <div className="pricing-stolen-price-area">
              <span className="pricing-stolen-price">₹{starterPrice.toLocaleString('en-IN')}</span>
              <span className="pricing-stolen-period">/{starterPlan?.period || "month"}</span>
            </div>

            <button className="pricing-stolen-btn pricing-stolen-btn-light" onClick={() => startPayment("starter", starterFast)} disabled={busy}>
              {busy ? "Processing…" : (starterPlan?.buttonText || "Get Started")}
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="pricing-stolen-bottom-light">
            <div className="pricing-stolen-features">
              {starterFeatures.map((feature, idx) => (
                <div 
                  key={idx} 
                  className={`pricing-stolen-feature-item ${feature.enabled ? "" : "disabled"}`}
                >
                  {feature.enabled ? (
                    <LightCheckIcon className="flex-shrink-0" />
                  ) : (
                    <Lock size={14} className="flex-shrink-0" style={{ color: "rgba(32, 22, 17, 0.4)" }} />
                  )}
                  <span className="pricing-stolen-feature-text">{feature.text}</span>
                </div>
              ))}
            </div>
            <ToggleSwitch
              enabled={starterFast}
              onChange={setStarterFast}
              label={`${starterPlan?.addon?.label || "Add-on"} (+₹${(starterPlan?.addon?.price || 0).toLocaleString('en-IN')})`}
            />
          </div>
        </div>

        {/* Pro Card (12-Month Access) */}
        <div className="pricing-stolen-card-dark">
          <div className="pricing-stolen-inner-dark">
            <div className="pricing-stolen-header">
              <div className="pricing-stolen-title-area">
                <h2>{proPlan?.name || "12-Month"}</h2>
                <p>Unlock complete access to the full platform.</p>
              </div>
              {proPlan?.badge && (
                <span className="pricing-stolen-badge">{proPlan.badge}</span>
              )}
            </div>

            <div className="pricing-stolen-price-area">
              <span className="pricing-stolen-price">₹{proPrice.toLocaleString('en-IN')}</span>
              <span className="pricing-stolen-period">/{proPlan?.period || "year"}</span>
            </div>

            <button className="pricing-stolen-btn pricing-stolen-btn-dark" onClick={() => startPayment("pro", proFast)} disabled={busy}>
              {busy ? "Processing…" : (proPlan?.buttonText || "Enroll Now")}
              <AcademicHatIcon />
            </button>
          </div>

          <div className="pricing-stolen-bottom-dark">
            <div className="pricing-stolen-features">
              {proFeatures.map((feature, idx) => (
                <div 
                  key={idx} 
                  className={`pricing-stolen-feature-item ${feature.enabled ? "" : "disabled"}`}
                >
                  {feature.enabled ? (
                    <DarkCheckIcon className="flex-shrink-0" />
                  ) : (
                    <Lock size={14} className="flex-shrink-0" style={{ color: "rgba(250, 248, 245, 0.4)" }} />
                  )}
                  <span className="pricing-stolen-feature-text">{feature.text}</span>
                </div>
              ))}
            </div>
            <ToggleSwitch
              enabled={proFast}
              onChange={setProFast}
              isDark
              label={`${proPlan?.addon?.label || "Add-on"} (+₹${(proPlan?.addon?.price || 0).toLocaleString('en-IN')})`}
            />
          </div>
        </div>
      </div>
      )}
    </div>
  </section>
);
}

