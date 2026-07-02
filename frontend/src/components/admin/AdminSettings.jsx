import React, { useEffect, useState } from "react";
import { User, Mail, ShieldCheck, Server, CheckCircle2, AlertCircle, CreditCard, BookOpen, Users, ClipboardList, Database, ExternalLink } from "lucide-react";
import { useAuthenticationController } from "../../hooks/useAuthenticationController";
import { useCourseContext } from "../../contexts/CourseContext";
import { useAdminController } from "../../hooks/useAdminController";
import { api } from "../../api/ApiClient";
import { isSupabaseConfigured } from "../../lib/supabaseClient";

const money = (n, cur) => `${cur === "INR" ? "₹" : ""}${Number(n).toLocaleString("en-IN")}`;

export default function AdminSettings() {
  const { user } = useAuthenticationController();
  const { chapters } = useCourseContext();
  const { students } = useAdminController();
  const [me, setMe] = useState(null);
  const [health, setHealth] = useState(null);
  const [pricing, setPricing] = useState(null);

  useEffect(() => {
    api.get("/user/me").then(setMe).catch(() => {});
    api.get("/health").then(() => setHealth(true)).catch(() => setHealth(false));
    api.get("/content/pricing").then(setPricing).catch(() => {});
  }, []);

  const topicCount = chapters.reduce((n, c) => n + (c.topics?.length || 0), 0);

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
          <p>Your account, platform health, pricing and an at-a-glance overview.</p>
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

        <section className="set-card">
          <h2><CreditCard size={16} /> Pricing &amp; payments</h2>
          {!pricing ? (
            <p className="set-muted">Loading pricing…</p>
          ) : (
            <>
              <div className="set-check">
                {pricing.available ? <CheckCircle2 size={16} className="ok" /> : <AlertCircle size={16} className="warn" />}
                <span>Payments</span>
                <small>{pricing.available ? "Live" : "Coming soon"}</small>
              </div>
              {(pricing.plans || []).map((p) => (
                <div className="set-item" key={p.id}>
                  <CreditCard size={15} />
                  <span>{p.name}</span>
                  <strong>{money(p.price, pricing.currency)}<em>/{p.period}</em></strong>
                </div>
              ))}
            </>
          )}
        </section>

        <section className="set-card">
          <h2><Database size={16} /> Overview</h2>
          <div className="set-stats">
            <div className="set-stat"><BookOpen size={16} /><strong>{chapters.length}</strong><span>Chapters</span></div>
            <div className="set-stat"><ClipboardList size={16} /><strong>{topicCount}</strong><span>Topics</span></div>
            <div className="set-stat"><Users size={16} /><strong>{students?.length || 0}</strong><span>Students</span></div>
          </div>
        </section>

        <section className="set-card">
          <h2><ExternalLink size={16} /> Quick links</h2>
          <a className="set-link" href="https://ibis-frontend.pages.dev" target="_blank" rel="noreferrer">
            Live site <ExternalLink size={13} />
          </a>
          <a className="set-link" href="https://ibis-backend-svno.onrender.com/api/health" target="_blank" rel="noreferrer">
            Backend health <ExternalLink size={13} />
          </a>
        </section>
      </div>
    </div>
  );
}
