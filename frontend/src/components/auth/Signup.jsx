import { useAccessController } from "../../hooks/useAccessController";
import { useNavigationController } from "../../hooks/useNavigationController";
import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { Brand, Button, GlassButton } from '../ui/LegacyUI';
import { useAuthenticationController } from '../../hooks/useAuthenticationController';

import PortalBadge from '../ui/PortalBadge';
import { Mail, Lock, Eye, EyeOff, Users } from 'lucide-react';
const FaultyTerminal = React.lazy(() => import('../ui/FaultyTerminal'));

export function Pupil({ size = 12, maxDistance = 5, pupilColor = "black", forceLookX, forceLookY }) {
  const pupilPosition = {
    x: forceLookX ?? 0,
    y: forceLookY ?? 0
  };

  return (
    <div
      className="signup-pupil"
      data-max-distance={maxDistance}
      data-force-look={forceLookX !== undefined && forceLookY !== undefined ? "true" : undefined}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`
      }}
    />
  );
}

export function EyeBall({
  size = 48,
  pupilSize = 16,
  maxDistance = 10,
  eyeColor = "white",
  pupilColor = "black",
  isBlinking = false,
  forceLookX,
  forceLookY
}) {
  const pupilPosition = {
    x: forceLookX ?? 0,
    y: forceLookY ?? 0
  };

  return (
    <div
      className="signup-eye-ball"
      data-max-distance={maxDistance}
      style={{
        width: `${size}px`,
        height: isBlinking ? "2px" : `${size}px`,
        backgroundColor: eyeColor
      }}
    >
      {!isBlinking && (
        <div
          className="signup-pupil"
          data-force-look={forceLookX !== undefined && forceLookY !== undefined ? "true" : undefined}
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`
          }}
        />
      )}
    </div>
  );
}

export function updateSignupPupils(root, clientX, clientY) {
  if (!root) return;

  root.querySelectorAll(".signup-pupil").forEach((pupil) => {
    if (pupil.dataset.forceLook === "true") return;
    const trackingBox = pupil.closest(".signup-eye-ball") || pupil.parentElement;
    if (!trackingBox) return;

    const rect = trackingBox.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const maxDistance = Number(pupil.dataset.maxDistance || trackingBox.dataset.maxDistance || 5);
    const distance = Math.min(Math.hypot(deltaX, deltaY), maxDistance);
    const angle = Math.atan2(deltaY, deltaX);

    pupil.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
  });
}

export function SignupCharacters({ password, showPassword, isTyping }) {
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  const stageRef = useRef(null);
  const purpleRef = useRef(null);
  const blackRef = useRef(null);
  const yellowRef = useRef(null);
  const orangeRef = useRef(null);
  const purpleEyesRef = useRef(null);
  const blackEyesRef = useRef(null);
  const orangeEyesRef = useRef(null);
  const yellowEyesRef = useRef(null);
  const yellowMouthRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(0);
  const passwordVisible = password.length > 0 && showPassword;
  const passwordHidden = password.length > 0 && !showPassword;

  useEffect(() => {
    const getPosition = (ref, clientX, clientY) => {
      if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };

      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 3;
      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;

      return {
        faceX: Math.max(-15, Math.min(15, deltaX / 20)),
        faceY: Math.max(-10, Math.min(10, deltaY / 30)),
        bodySkew: Math.max(-6, Math.min(6, -deltaX / 120))
      };
    };

    const setEyes = (node, left, top) => {
      if (!node) return;
      node.style.left = `${left}px`;
      node.style.top = `${top}px`;
    };

    const applyMotion = () => {
      const { x, y } = pointerRef.current;
      const purplePos = getPosition(purpleRef, x, y);
      const blackPos = getPosition(blackRef, x, y);
      const yellowPos = getPosition(yellowRef, x, y);
      const orangePos = getPosition(orangeRef, x, y);

      if (purpleRef.current) {
        purpleRef.current.style.height = (isTyping || passwordHidden) ? "440px" : "400px";
        purpleRef.current.style.transform = passwordVisible
          ? "skewX(0deg)"
          : (isTyping || passwordHidden)
            ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)`
            : `skewX(${purplePos.bodySkew || 0}deg)`;
      }

      if (blackRef.current) {
        blackRef.current.style.transform = passwordVisible
          ? "skewX(0deg)"
          : isLookingAtEachOther
            ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
            : (isTyping || passwordHidden)
              ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)`
              : `skewX(${blackPos.bodySkew || 0}deg)`;
      }

      if (orangeRef.current) {
        orangeRef.current.style.transform = passwordVisible ? "skewX(0deg)" : `skewX(${orangePos.bodySkew || 0}deg)`;
      }

      if (yellowRef.current) {
        yellowRef.current.style.transform = passwordVisible ? "skewX(0deg)" : `skewX(${yellowPos.bodySkew || 0}deg)`;
      }

      setEyes(purpleEyesRef.current, passwordVisible ? 20 : isLookingAtEachOther ? 55 : 45 + purplePos.faceX, passwordVisible ? 35 : isLookingAtEachOther ? 65 : 40 + purplePos.faceY);
      setEyes(blackEyesRef.current, passwordVisible ? 10 : isLookingAtEachOther ? 32 : 26 + blackPos.faceX, passwordVisible ? 28 : isLookingAtEachOther ? 12 : 32 + blackPos.faceY);
      setEyes(orangeEyesRef.current, passwordVisible ? 50 : 82 + orangePos.faceX, passwordVisible ? 85 : 90 + orangePos.faceY);
      setEyes(yellowEyesRef.current, passwordVisible ? 20 : 52 + yellowPos.faceX, passwordVisible ? 35 : 40 + yellowPos.faceY);

      if (yellowMouthRef.current) {
        yellowMouthRef.current.style.left = `${passwordVisible ? 10 : 40 + yellowPos.faceX}px`;
        yellowMouthRef.current.style.top = `${passwordVisible ? 88 : 88 + yellowPos.faceY}px`;
      }

      updateSignupPupils(stageRef.current, x, y);
    };

    const scheduleMotion = () => {
      if (rafRef.current) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = 0;
        applyMotion();
      });
    };

    if (!pointerRef.current.x && !pointerRef.current.y) {
      pointerRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }

    const handleMouseMove = (event) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
      scheduleMotion();
    };

    applyMotion();
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [passwordVisible, passwordHidden, isTyping, isLookingAtEachOther, isPurplePeeking, isPurpleBlinking, isBlackBlinking]);

  useEffect(() => {
    const scheduleBlink = () => {
      const blinkTimeout = window.setTimeout(() => {
        setIsPurpleBlinking(true);
        window.setTimeout(() => {
          setIsPurpleBlinking(false);
          scheduleBlink();
        }, 150);
      }, Math.random() * 4000 + 3000);

      return blinkTimeout;
    };

    const timeout = scheduleBlink();
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const scheduleBlink = () => {
      const blinkTimeout = window.setTimeout(() => {
        setIsBlackBlinking(true);
        window.setTimeout(() => {
          setIsBlackBlinking(false);
          scheduleBlink();
        }, 150);
      }, Math.random() * 4000 + 3000);

      return blinkTimeout;
    };

    const timeout = scheduleBlink();
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isTyping) {
      setIsLookingAtEachOther(false);
      return undefined;
    }

    setIsLookingAtEachOther(true);
    const timer = window.setTimeout(() => setIsLookingAtEachOther(false), 800);
    return () => window.clearTimeout(timer);
  }, [isTyping]);

  useEffect(() => {
    if (!(password.length > 0 && showPassword)) {
      setIsPurplePeeking(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setIsPurplePeeking(true);
      window.setTimeout(() => setIsPurplePeeking(false), 800);
    }, Math.random() * 3000 + 2000);

    return () => window.clearTimeout(timer);
  }, [password, showPassword, isPurplePeeking]);

  return (
    <div ref={stageRef} className="signup-character-stage">
      <div
        ref={purpleRef}
        className="signup-character signup-purple"
        style={{
          height: (isTyping || passwordHidden) ? "440px" : "400px",
          transform: passwordVisible ? "skewX(0deg)" : (isTyping || passwordHidden) ? "skewX(-12deg) translateX(40px)" : "skewX(0deg)"
        }}
      >
        <div
          ref={purpleEyesRef}
          className="signup-eyes signup-purple-eyes"
          style={{
            left: passwordVisible ? "20px" : isLookingAtEachOther ? "55px" : "45px",
            top: passwordVisible ? "35px" : isLookingAtEachOther ? "65px" : "40px"
          }}
        >
          <EyeBall size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isPurpleBlinking} forceLookX={passwordVisible ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined} forceLookY={passwordVisible ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} />
          <EyeBall size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isPurpleBlinking} forceLookX={passwordVisible ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined} forceLookY={passwordVisible ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} />
        </div>
      </div>

      <div
        ref={blackRef}
        className="signup-character signup-black"
        style={{
          transform: passwordVisible
            ? "skewX(0deg)"
            : isLookingAtEachOther
              ? "skewX(10deg) translateX(20px)"
              : (isTyping || passwordHidden)
                ? "skewX(0deg)"
                : "skewX(0deg)"
        }}
      >
        <div
          ref={blackEyesRef}
          className="signup-eyes signup-black-eyes"
          style={{
            left: passwordVisible ? "10px" : isLookingAtEachOther ? "32px" : "26px",
            top: passwordVisible ? "28px" : isLookingAtEachOther ? "12px" : "32px"
          }}
        >
          <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isBlackBlinking} forceLookX={passwordVisible ? -4 : isLookingAtEachOther ? 0 : undefined} forceLookY={passwordVisible ? -4 : isLookingAtEachOther ? -4 : undefined} />
          <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isBlackBlinking} forceLookX={passwordVisible ? -4 : isLookingAtEachOther ? 0 : undefined} forceLookY={passwordVisible ? -4 : isLookingAtEachOther ? -4 : undefined} />
        </div>
      </div>

      <div
        ref={orangeRef}
        className="signup-character signup-orange"
        style={{ transform: "skewX(0deg)" }}
      >
        <div
          ref={orangeEyesRef}
          className="signup-eyes signup-orange-eyes"
          style={{
            left: passwordVisible ? "50px" : "82px",
            top: passwordVisible ? "85px" : "90px"
          }}
        >
          <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={passwordVisible ? -5 : undefined} forceLookY={passwordVisible ? -4 : undefined} />
          <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={passwordVisible ? -5 : undefined} forceLookY={passwordVisible ? -4 : undefined} />
        </div>
      </div>

      <div
        ref={yellowRef}
        className="signup-character signup-yellow"
        style={{ transform: "skewX(0deg)" }}
      >
        <div
          ref={yellowEyesRef}
          className="signup-eyes signup-yellow-eyes"
          style={{
            left: passwordVisible ? "20px" : "52px",
            top: passwordVisible ? "35px" : "40px"
          }}
        >
          <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={passwordVisible ? -5 : undefined} forceLookY={passwordVisible ? -4 : undefined} />
          <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={passwordVisible ? -5 : undefined} forceLookY={passwordVisible ? -4 : undefined} />
        </div>
        <div
          ref={yellowMouthRef}
          className="signup-yellow-mouth"
          style={{
            left: passwordVisible ? "10px" : "40px",
            top: "88px"
          }}
        />
      </div>
    </div>
  );
}

export default function Signup({ initialMode = "signup" }) {
  const { enterPortal, initiateCheckout } = useAccessController();
  const { goToHome, goToLegal } = useNavigationController();
  
  const onBack = goToHome;
  const onPay = () => initiateCheckout("signup");
  const onLogin = (u) => enterPortal("full", u);
  const onLegal = goToLegal;

  const [authMode, setAuthMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isTyping = studentName.length > 0 || email.length > 0 || password.length > 0;
  const isLogin = authMode === "login";

  const { signIn, signUp } = useAuthenticationController();
  const [authError, setAuthError] = useState("");
  const [authInfo, setAuthInfo] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setAuthError("");
    setAuthInfo("");
    setIsLoading(true);
    try {
      if (isLogin) {
        const loggedInUser = await signIn(email, password);
        onLogin(loggedInUser);
      } else {
        const user = await signUp(email, password, { full_name: studentName });
        if (user) {
          onPay();
        } else {
          setAuthInfo("Account created. Check your email to confirm, then log in.");
          switchMode("login");
        }
      }
    } catch (err) {
      setAuthError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (mode) => {
    setAuthMode(mode);
    setShowPassword(false);
  };

  return (
    <section className="signup-screen">
      <div className="auth-terminal-bg" aria-hidden="true">
        <React.Suspense fallback={<span className="auth-terminal-fallback" />}>
          <FaultyTerminal
            scale={1.5}
            gridMul={[2, 1]}
            digitSize={1.2}
            timeScale={0.5}
            scanlineIntensity={0.5}
            glitchAmount={1}
            flickerAmount={1}
            noiseAmp={1}
            chromaticAberration={0}
            dither={0}
            curvature={0.1}
            tint="#9b3f24"
            mouseStrength={0.5}
            brightness={0.72}
            transparent
          />
        </React.Suspense>
      </div>
      <div className="signup-shell">
        <div className="signup-visual-panel">
          <div className="signup-visual-top">
            <Brand compact />
          </div>

          <div className="signup-character-wrap">
            <SignupCharacters password={password} showPassword={showPassword} isTyping={isTyping} />
          </div>

          <div className="signup-panel-footer">
            <button type="button" onClick={() => onLegal("privacy")}>Privacy Policy</button>
            <button type="button" onClick={() => onLegal("terms")}>Terms of Service</button>
            <button type="button" onClick={() => onLegal("contact")}>Contact</button>
          </div>
        </div>

        <div className="signup-form-panel">
          <form className="signup-form-card" onSubmit={handleSubmit}>
            <GlassButton type="button" size="icon" className="signup-back-btn" aria-label="Back" onClick={onBack}>
              <ArrowLeft size={18} />
            </GlassButton>

            <div className="auth-mode-tabs" aria-label="Choose account action">
              <div className={`auth-mode-tabs-slider ${isLogin ? "is-login" : "is-signup"}`} />
              <button type="button" className={!isLogin ? "active" : ""} onClick={() => switchMode("signup")}>Sign up</button>
              <button type="button" className={isLogin ? "active" : ""} onClick={() => switchMode("login")}>Login</button>
            </div>

            <div className="signup-form-heading">
              <span className="auth-kicker">{isLogin ? "Student access" : "Create student account"}</span>
              <h1>{isLogin ? "Welcome back to Ibis" : "Start learning with Ibis"}</h1>
              <p>
                {isLogin
                  ? "Login to reopen your classes, progress, tests, and teacher updates."
                  : "Create your portal account, then choose the plan or batch access that fits you."}
              </p>
            </div>

            {authError && (
              <div role="alert" style={{ color: "#b3402a", fontSize: "0.82rem", fontWeight: 600, margin: "-4px 0 2px" }}>
                {authError}
              </div>
            )}
            {authInfo && (
              <div role="status" style={{ color: "#1f7a4d", fontSize: "0.82rem", fontWeight: 600, margin: "-4px 0 2px" }}>
                {authInfo}
              </div>
            )}

            {!isLogin && (
              <label className="signup-field">
                <span>Student name</span>
                <div className="signup-glass-input">
                  <Users size={18} />
                  <input
                    required
                    type="text"
                    placeholder="Your name"
                    value={studentName}
                    onChange={(event) => setStudentName(event.target.value)}
                  />
                </div>
              </label>
            )}

            <label className="signup-field">
              <span>Email</span>
              <div className="signup-glass-input">
                <Mail size={18} />
                <input
                  required
                  type="email"
                  placeholder="anna@gmail.com"
                  value={email}
                  autoComplete="off"
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </label>

            <label className="signup-field">
              <span>Password</span>
              <div className="signup-glass-input signup-password-wrap">
                <Lock size={18} />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((current) => !current)}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </label>

            <div className="signup-options">
              <label>
                <input type="checkbox" />
                <span>Remember for 30 days</span>
              </label>
              {isLogin ? <button type="button">Forgot password?</button> : <span className="signup-secure-note"><Lock size={13} /> Secure checkout next</span>}
            </div>

            <GlassButton type="submit" size="default" className="auth-cta-glass" contentClassName="auth-cta-glass-text" disabled={isLoading}>
              <span>{isLoading ? (isLogin ? "Logging in..." : "Creating account...") : (isLogin ? "Login to portal" : "Continue to plans")}</span>
              <ArrowRight size={18} />
            </GlassButton>

            <button type="button" className="auth-switch-copy" onClick={() => switchMode(isLogin ? "signup" : "login")}>
              {isLogin ? "New to Ibis? Create a student account" : "Already have an account? Login"}
            </button>

          </form>
        </div>
      </div>
    </section>
  );
}

