import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, Users, Activity, ClipboardList, TrendingUp, Trophy, Copy, Check, AlertCircle } from "lucide-react";
import { BatchRepository } from "../../repositories/BatchRepository";

const band = (score) => (score >= 75 ? "high" : score >= 45 ? "mid" : "low");

export default function AdminBatchDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // On-demand: analytics are fetched only when this page opens, never by default.
  useEffect(() => {
    let active = true;
    setData(null); setError("");
    BatchRepository.getBatchAnalytics(id)
      .then((d) => { if (active) setData(d); })
      .catch(() => { if (active) setError("Could not load batch analytics."); });
    return () => { active = false; };
  }, [id]);

  const copyCode = async (code) => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  if (error) {
    return (
      <div className="adminx-page">
        <nav className="content-breadcrumb"><Link to="/admin/batches"><ArrowLeft size={14} /> Batches</Link></nav>
        <div className="content-empty"><AlertCircle size={30} /><h2>Analytics unavailable</h2><p>{error}</p></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="adminx-page">
        <nav className="content-breadcrumb"><Link to="/admin/batches"><ArrowLeft size={14} /> Batches</Link></nav>
        <header className="adminx-pagehead"><div><h1>Batch analytics</h1><p>Loading…</p></div></header>
      </div>
    );
  }

  const { batch, stats, ranking } = data;

  return (
    <div className="adminx-page">
      <nav className="content-breadcrumb">
        <Link to="/admin/batches"><ArrowLeft size={14} /> Batches</Link>
        <ChevronRight size={13} />
        <span>{batch.name}</span>
      </nav>

      <header className="adminx-pagehead">
        <div>
          <h1>{batch.name}</h1>
          <p>{batch.school} · <span className={`bx-status ${(batch.status || "Active").toLowerCase()}`}>{batch.status || "Active"}</span></p>
        </div>
        <button className="bx-code" onClick={() => copyCode(batch.code)} title="Copy batch code">
          {batch.code} {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
      </header>

      <div className="bd-stats">
        <div className="bd-stat"><span className="bd-stat-ico"><Users size={18} /></span><strong>{stats.students}</strong><span>Students</span></div>
        <div className="bd-stat"><span className="bd-stat-ico"><Activity size={18} /></span><strong>{stats.activeStudents}</strong><span>Active</span></div>
        <div className="bd-stat"><span className="bd-stat-ico"><ClipboardList size={18} /></span><strong>{stats.totalAttempts}</strong><span>Tests taken</span></div>
        <div className="bd-stat"><span className="bd-stat-ico"><TrendingUp size={18} /></span><strong>{stats.avgScore}%</strong><span>Avg score</span></div>
      </div>

      <section className="bd-ranking">
        <h2><Trophy size={17} /> Batch ranking</h2>
        {ranking.length === 0 ? (
          <p className="tmx-empty">No students in this batch yet.</p>
        ) : (
          <div className="bd-rank-list">
            <div className="bd-rank-head">
              <span>#</span><span>Student</span><span>Tests</span><span>Avg</span>
            </div>
            {ranking.map((r) => (
              <div className="bd-rank-row" key={r.id}>
                <span className={`bd-rank-num ${r.rank <= 3 && r.tests > 0 ? "top" : ""}`}>{r.rank}</span>
                <span className="bd-rank-name"><strong>{r.name}</strong><small>{r.email}</small></span>
                <span className="bd-rank-tests">{r.tests}</span>
                <span className={`bd-rank-avg band-${band(r.avgScore)}`}>{r.tests ? `${r.avgScore}%` : "—"}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
