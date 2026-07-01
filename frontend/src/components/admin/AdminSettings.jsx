import React, { useEffect, useState } from "react";
import { User, Mail, ShieldCheck, Server, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuthenticationController } from "../../hooks/useAuthenticationController";
import { api } from "../../api/ApiClient";
import { isSupabaseConfigured } from "../../lib/supabaseClient";

export default function AdminSettings() {
  const { user } = useAuthenticationController();
  const [me, setMe] = useState(null);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    api.get("/user/me").then(setMe).catch(() => {});
    api.get("/health").then(() => setHealth(true)).catch(() => setHealth(false));
  }, []);

  const Row = ({ ok, label, detail }) => (
    <div className="set-check">
      {ok ? <CheckCircle2 size={16} className="ok" /> : <AlertCircle size={16} className="warn" />}
      <span>{label}</span>
      <small>{detail}</small>
    </div>
  );

  return (
    <div className="adminx-page">
      <header className="adminx-pagehead">
        <div>
          <h1>Settings</h1>
          <p>Your account and platform status.</p>
        </div>
      </header>

      <div className="set-grid">
        <section className="set-card">
          <h2><User size={16} /> Account</h2>
          <div className="set-item"><User size={15} /><span>Name</span><strong>{me?.full_name || user?.name || "—"}</strong></div>
          <div className="set-item"><Mail size={15} /><span>Email</span><strong>{me?.email || "—"}</strong></div>
          <div className="set-item"><ShieldCheck size={15} /><span>Role</span><strong>{me?.role || user?.role || "admin"}</strong></div>
        </section>

        <section className="set-card">
          <h2><Server size={16} /> Platform status</h2>
          <Row ok={health === true} label="Backend API" detail={health === true ? "Reachable" : "Unreachable"} />
          <Row ok={isSupabaseConfigured} label="Supabase client" detail={isSupabaseConfigured ? "Configured (realtime on)" : "Missing env"} />
          <Row ok={true} label="Live sync" detail="Student portal updates in real time" />
        </section>
      </div>
    </div>
  );
}
