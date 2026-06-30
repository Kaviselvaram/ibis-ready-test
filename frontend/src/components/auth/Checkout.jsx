import { useAuthContext } from "../../contexts/AuthContext";
import { useUI } from "../../contexts/UIContext";
import { useAccessController } from "../../hooks/useAccessController";
import { useNavigationController } from "../../hooks/useNavigationController";
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Check, Lock, GraduationCap } from 'lucide-react';
import { Brand, Button, GlassButton, Pill } from '../ui/LegacyUI';
import ReflectiveTiltFrame from '../ui/ReflectiveTiltFrame';
import TesplePill from '../ui/TesplePill';

const ToggleSwitch = ({ enabled, onChange, label, isDark }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', marginTop: '16px', fontWeight: 600 }}>
    <input type="checkbox" checked={enabled} onChange={(e) => onChange(e.target.checked)} style={{ cursor: 'pointer' }} />
    {label}
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
  
  const onBack = goBackFromCheckout;
  const onDone = () => {
    if (isSignedIn) {
      enterPortal("full");
    } else {
      goToSignup();
    }
  };

  const [starterFast, setStarterFast] = useState(false);
  const [proFast, setProFast] = useState(false);

  // Price calculations
  const starterPrice = starterFast ? 2499 + 499 : 2499;
  const proPrice = proFast ? 14999 + 1999 : 14999;

  const starterFeatures = [
    { text: "1 Chapter Access", enabled: true },
    { text: "Core Physics Lessons", enabled: true },
    { text: "Active Doubt Support", enabled: true },
    { text: "Basic Practice", enabled: true },
    { text: "Progression Tracking", enabled: false },
    { text: "Rewards & Badges", enabled: false },
    { text: "Leaderboard & Ranking", enabled: false },
  ];

  const proFeatures = [
    { text: "Full Access (All Chapters)", enabled: true },
    { text: "Core Physics Lessons", enabled: true },
    { text: "Active Doubt Support", enabled: true },
    { text: "Basic Practice", enabled: true },
    { text: "Progression Tracking", enabled: true },
    { text: "Rewards & Badges", enabled: true },
    { text: "Leaderboard & Ranking", enabled: true },
  ];

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
        </div>

      {/* Cards Grid */}
      <div className="pricing-stolen-grid">
        {/* Starter Card (1-Month Access) */}
        <div className="pricing-stolen-card-light">
          <div className="pricing-stolen-inner-light">
            <div className="pricing-stolen-header">
              <div className="pricing-stolen-title-area">
                <h2>1-Month</h2>
                <p>Perfect for trying out Ibis Portal chapters.</p>
              </div>
              <span className="pricing-stolen-badge">
                Most Flexible
              </span>
            </div>

            <div className="pricing-stolen-price-area">
              <span className="pricing-stolen-price">₹{starterPrice.toLocaleString('en-IN')}</span>
              <span className="pricing-stolen-period">/month</span>
            </div>

            <button className="pricing-stolen-btn pricing-stolen-btn-light" onClick={onDone}>
              Get Started
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
              label="Mentor doubt chat (+₹499)" 
            />
          </div>
        </div>

        {/* Pro Card (12-Month Access) */}
        <div className="pricing-stolen-card-dark">
          <div className="pricing-stolen-inner-dark">
            <div className="pricing-stolen-header">
              <div className="pricing-stolen-title-area">
                <h2>12-Month</h2>
                <p>Unlock complete access to the full platform.</p>
              </div>
              <span className="pricing-stolen-badge">
                Best Value
              </span>
            </div>

            <div className="pricing-stolen-price-area">
              <span className="pricing-stolen-price">₹{proPrice.toLocaleString('en-IN')}</span>
              <span className="pricing-stolen-period">/year</span>
            </div>

            <button className="pricing-stolen-btn pricing-stolen-btn-dark" onClick={onDone}>
              Enroll Now
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
              label="Printed prep books (+₹1,999)" 
            />
          </div>
        </div>
      </div>
    </div>
  </section>
);
}

