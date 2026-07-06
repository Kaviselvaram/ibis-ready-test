import React, { useEffect, useState } from "react";
import { User, Mail, ShieldCheck, Server, CheckCircle2, AlertCircle, CreditCard, BookOpen, Users, ClipboardList, Database, ExternalLink, Sliders, Save, Tag, Plus, Trash2, IndianRupee } from "lucide-react";
import { useAuthenticationController } from "../../hooks/useAuthenticationController";
import { useCourseContext } from "../../contexts/CourseContext";
import { useAdminController } from "../../hooks/useAdminController";
import { useToast, friendlyMessage } from "../../contexts/ToastContext";
import { api } from "../../api/ApiClient";
import { CourseRepository } from "../../repositories/CourseRepository";
import { isSupabaseConfigured } from "../../lib/supabaseClient";

const money = (n, cur) => `${cur === "INR" ? "₹" : ""}${Number(n).toLocaleString("en-IN")}`;

const DIFF_KEYS = ["Easy", "Medium", "Hard"];
const BLOOM_KEYS = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];

// Admin editor for the test-generation distribution (#7/#8). Reads and writes
// the backend config — never hardcoded. Backend normalizes proportionally, so
// the values are relative weights (shown as %); a live sum helps the admin.
function GenerationConfigCard() {
  const toast = useToast();
  const [cfg, setCfg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get("/test/config").then(setCfg).catch(() => {}); }, []);

  const setVal = (axis, key, v) => {
    const n = Math.max(0, Math.min(100, Number(v) || 0));
    setCfg((c) => ({ ...c, [axis]: { ...c[axis], [key]: n } }));
  };
  const sum = (axis) => (cfg ? Object.values(cfg[axis] || {}).reduce((a, b) => a + Number(b || 0), 0) : 0);

  const save = async () => {
    if (!cfg || busy) return;
    setBusy(true);
    try {
      const saved = await api.put("/test/config", { difficulty: cfg.difficulty, bloom: cfg.bloom });
      setCfg(saved);
      toast.success("Generation distribution saved");
    } catch (e) {
      toast.error(friendlyMessage(e, "Couldn’t save the distribution."));
    } finally { setBusy(false); }
  };

  return (
    <section className="set-card set-card-wide">
      <h2><Sliders size={16} /> Test generation distribution</h2>
      <p className="set-muted">How every generated paper is balanced. Applies to 50Q and 100Q papers.</p>
      {!cfg ? <p className="set-muted">Loading…</p> : (
        <>
          <div className="gencfg-block">
            <div className="gencfg-head"><span>Difficulty</span><b className={sum("difficulty") === 100 ? "ok" : "warn"}>{sum("difficulty")}%</b></div>
            <div className="gencfg-row">
              {DIFF_KEYS.map((k) => (
                <label key={k} className="gencfg-field"><span>{k}</span>
                  <input type="number" min="0" max="100" value={cfg.difficulty?.[k] ?? 0} onChange={(e) => setVal("difficulty", k, e.target.value)} /></label>
              ))}
            </div>
          </div>
          <div className="gencfg-block">
            <div className="gencfg-head"><span>Bloom's taxonomy</span><b className={sum("bloom") === 100 ? "ok" : "warn"}>{sum("bloom")}%</b></div>
            <div className="gencfg-row bloom">
              {BLOOM_KEYS.map((k) => (
                <label key={k} className="gencfg-field"><span>{k}</span>
                  <input type="number" min="0" max="100" value={cfg.bloom?.[k] ?? 0} onChange={(e) => setVal("bloom", k, e.target.value)} /></label>
              ))}
            </div>
          </div>
          <button type="button" className="gencfg-save" onClick={save} disabled={busy}>
            <Save size={15} /> {busy ? "Saving…" : "Save distribution"}
          </button>
        </>
      )}
    </section>
  );
}

// Admin-editable pricing (prices, titles, features, badges, button text, add-ons,
// default plan). Saves to the backend; the /checkout page reflects it instantly.
function PricingConfigCard() {
  const toast = useToast();
  const [cfg, setCfg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { CourseRepository.getPricing().then(setCfg).catch(() => {}); }, []);

  const setPlan = (i, patch) => setCfg((c) => ({ ...c, plans: c.plans.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) }));
  const setFeature = (pi, fi, patch) => setPlan(pi, { features: cfg.plans[pi].features.map((f, idx) => (idx === fi ? { ...f, ...patch } : f)) });
  const addFeature = (pi) => setPlan(pi, { features: [...(cfg.plans[pi].features || []), { text: "New feature", enabled: true }] });
  const removeFeature = (pi, fi) => setPlan(pi, { features: cfg.plans[pi].features.filter((_, idx) => idx !== fi) });
  const setAddon = (pi, patch) => setPlan(pi, { addon: { label: "", price: 0, ...(cfg.plans[pi].addon || {}), ...patch } });

  const save = async () => {
    if (!cfg || busy) return;
    setBusy(true);
    try {
      const payload = {
        currency: cfg.currency || "INR",
        defaultPlan: cfg.defaultPlan || "pro",
        plans: cfg.plans.map((p) => ({
          id: p.id, name: p.name, period: p.period, price: Number(p.price) || 0,
          badge: p.badge || "", buttonText: p.buttonText || "Get Started",
          addon: p.addon && p.addon.label ? { label: p.addon.label, price: Number(p.addon.price) || 0 } : null,
          features: (p.features || []).map((f) => ({ text: f.text, enabled: !!f.enabled }))
        }))
      };
      const saved = await CourseRepository.updatePricing(payload);
      setCfg((c) => ({ ...c, ...saved }));
      toast.success("Pricing updated — live on checkout");
    } catch (e) {
      toast.error(friendlyMessage(e, "Couldn’t save pricing."));
    } finally { setBusy(false); }
  };

  return (
    <section className="set-card set-card-wide">
      <h2><Tag size={16} /> Pricing &amp; plans</h2>
      <p className="set-muted">Edit prices, titles, features, badges, buttons and add-ons. Changes reflect instantly on the checkout page.</p>
      {!cfg ? <p className="set-muted">Loading…</p> : (
        <>
          <div className="pxcfg-plans">
            {cfg.plans.map((p, pi) => (
              <div key={p.id} className="pxcfg-plan">
                <div className="pxcfg-plan-head">
                  <span className="pxcfg-planid">{p.id}</span>
                  <label className="pxcfg-default">
                    <input type="radio" name="defaultPlan" checked={cfg.defaultPlan === p.id} onChange={() => setCfg((c) => ({ ...c, defaultPlan: p.id }))} /> Default
                  </label>
                </div>
                <div className="pxcfg-row2">
                  <label className="pxcfg-f"><span>Title</span><input value={p.name} onChange={(e) => setPlan(pi, { name: e.target.value })} /></label>
                  <label className="pxcfg-f"><span>Price (₹)</span><input type="number" min="0" value={p.price} onChange={(e) => setPlan(pi, { price: e.target.value })} /></label>
                </div>
                <div className="pxcfg-row2">
                  <label className="pxcfg-f"><span>Badge</span><input value={p.badge || ""} onChange={(e) => setPlan(pi, { badge: e.target.value })} /></label>
                  <label className="pxcfg-f"><span>Button text</span><input value={p.buttonText || ""} onChange={(e) => setPlan(pi, { buttonText: e.target.value })} /></label>
                </div>
                <div className="pxcfg-row2">
                  <label className="pxcfg-f"><span>Add-on label</span><input value={p.addon?.label || ""} onChange={(e) => setAddon(pi, { label: e.target.value })} /></label>
                  <label className="pxcfg-f"><span>Add-on price (₹)</span><input type="number" min="0" value={p.addon?.price || 0} onChange={(e) => setAddon(pi, { price: e.target.value })} /></label>
                </div>
                <div className="pxcfg-feats">
                  <div className="pxcfg-feats-head"><span>Features</span><button type="button" onClick={() => addFeature(pi)}><Plus size={13} /> Add</button></div>
                  {(p.features || []).map((f, fi) => (
                    <div key={fi} className="pxcfg-feat">
                      <input type="checkbox" checked={f.enabled} onChange={(e) => setFeature(pi, fi, { enabled: e.target.checked })} title="Included?" />
                      <input value={f.text} onChange={(e) => setFeature(pi, fi, { text: e.target.value })} />
                      <button type="button" className="pxcfg-feat-del" onClick={() => removeFeature(pi, fi)} aria-label="Remove feature"><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="gencfg-save" onClick={save} disabled={busy}>
            <Save size={15} /> {busy ? "Saving…" : "Save pricing"}
          </button>
        </>
      )}
    </section>
  );
}

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

        <GenerationConfigCard />

        <PricingConfigCard />

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
