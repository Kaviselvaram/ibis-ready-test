import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Mail, Lock, CheckCircle2, AlertCircle, Eye, EyeOff, KeyRound } from "lucide-react";
import { AuthenticationRepository } from "../../repositories/AuthenticationRepository";
import { Brand } from "../ui/LegacyUI";

function AuthShell({ children }) {
  return (
    <section className="pwreset-screen">
      <div className="pwreset-topbar"><Brand compact /></div>
      <div className="pwreset-center">
        <div className="pwreset-card">{children}</div>
      </div>
    </section>
  );
}

// ---- Request a reset link ----
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | sent
  const [error, setError] = useState("");

  const submit = async (e) => {
    e?.preventDefault();
    const clean = email.trim();
    if (!clean || status === "loading") return;
    setStatus("loading");
    setError("");
    try {
      await AuthenticationRepository.forgotPassword(clean);
      setStatus("sent");
    } catch (err) {
      // The endpoint never reveals account existence; a failure here is network/server.
      setError("Something went wrong. Please try again in a moment.");
      setStatus("idle");
    }
  };

  if (status === "sent") {
    return (
      <AuthShell>
        <div className="pwreset-icon ok"><CheckCircle2 size={26} /></div>
        <h1>Check your email</h1>
        <p>If an account exists for <b>{email.trim()}</b>, we've sent a password-reset link. It expires in 1 hour.</p>
        <button className="pwreset-btn" onClick={() => navigate("/login")}><ArrowLeft size={16} /> Back to login</button>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="pwreset-icon"><KeyRound size={24} /></div>
      <h1>Forgot your password?</h1>
      <p>Enter your account email and we'll send you a secure link to reset it.</p>
      <form onSubmit={submit} className="pwreset-form">
        <label className="pwreset-field">
          <span>Email</span>
          <div className="pwreset-input"><Mail size={15} />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoFocus required />
          </div>
        </label>
        {error && <div className="pwreset-error"><AlertCircle size={14} /> {error}</div>}
        <button type="submit" className="pwreset-btn primary" disabled={status === "loading" || !email.trim()}>
          {status === "loading" ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <button className="pwreset-textlink" onClick={() => navigate("/login")}><ArrowLeft size={14} /> Back to login</button>
    </AuthShell>
  );
}

// ---- Set a new password from the emailed token ----
export function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | done
  const [error, setError] = useState("");

  const tooShort = pw.length > 0 && pw.length < 8;
  const mismatch = confirm.length > 0 && pw !== confirm;
  const canSubmit = pw.length >= 8 && pw === confirm && status !== "loading";

  const submit = async (e) => {
    e?.preventDefault();
    if (!canSubmit) return;
    setStatus("loading");
    setError("");
    try {
      await AuthenticationRepository.resetPassword(token, pw);
      setStatus("done");
    } catch (err) {
      // Backend returns friendly messages for invalid/expired tokens.
      setError(err?.cause?.message || err?.message || "This reset link is invalid or has expired. Please request a new one.");
      setStatus("idle");
    }
  };

  if (!token) {
    return (
      <AuthShell>
        <div className="pwreset-icon err"><AlertCircle size={26} /></div>
        <h1>Invalid reset link</h1>
        <p>This link is missing its reset token. Please request a new password-reset email.</p>
        <button className="pwreset-btn primary" onClick={() => navigate("/forgot-password")}>Request a new link</button>
      </AuthShell>
    );
  }

  if (status === "done") {
    return (
      <AuthShell>
        <div className="pwreset-icon ok"><CheckCircle2 size={26} /></div>
        <h1>Password updated</h1>
        <p>Your password has been changed. You can now log in with your new password.</p>
        <button className="pwreset-btn primary" onClick={() => navigate("/login")}>Go to login</button>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="pwreset-icon"><Lock size={24} /></div>
      <h1>Set a new password</h1>
      <p>Choose a strong password you don't use elsewhere.</p>
      <form onSubmit={submit} className="pwreset-form">
        <label className="pwreset-field">
          <span>New password</span>
          <div className="pwreset-input">
            <Lock size={15} />
            <input type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 8 characters" autoFocus required />
            <button type="button" className="pwreset-eye" onClick={() => setShow((s) => !s)} aria-label="Toggle password">
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </label>
        <label className="pwreset-field">
          <span>Confirm password</span>
          <div className="pwreset-input"><Lock size={15} />
            <input type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password" required />
          </div>
        </label>
        {tooShort && <div className="pwreset-hint">Password must be at least 8 characters.</div>}
        {mismatch && <div className="pwreset-hint">Passwords don't match.</div>}
        {error && <div className="pwreset-error"><AlertCircle size={14} /> {error}</div>}
        <button type="submit" className="pwreset-btn primary" disabled={!canSubmit}>
          {status === "loading" ? "Updating…" : "Update password"}
        </button>
      </form>
    </AuthShell>
  );
}
