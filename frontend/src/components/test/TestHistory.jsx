import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ClipboardList, ChevronRight, Search, X, ChevronLeft,
  TrendingUp, Trophy, CheckCircle2, ListFilter
} from "lucide-react";
import { TestRepository, testTypeLabel } from "../../repositories/TestRepository";
import { GlassButton } from "../ui/LegacyUI";

const PAGE_SIZE = 8;
const band = (s) => (s >= 70 ? "high" : s >= 50 ? "mid" : "low");
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function TestHistory() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const profileId = search.get("student");
  const studentName = search.get("name");
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [bandFilter, setBandFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    TestRepository.history(profileId || undefined)
      .then((r) => active && setRows(r || []))
      .catch(() => active && setError("Could not load test history."));
    return () => { active = false; };
  }, [profileId]);

  const back = () => navigate(profileId ? "/admin/students" : "/student");
  const openResult = (id) => navigate(`/test-result/${id}${profileId ? "?from=admin" : ""}`);

  const types = useMemo(() => [...new Set((rows || []).map((r) => r.test_type).filter(Boolean))], [rows]);

  const stats = useMemo(() => {
    const list = rows || [];
    if (!list.length) return null;
    const scores = list.map((r) => Number(r.score) || 0);
    return {
      total: list.length,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / list.length),
      best: Math.round(Math.max(...scores)),
      passRate: Math.round((scores.filter((s) => s >= 40).length / list.length) * 100)
    };
  }, [rows]);

  const filtered = useMemo(() => {
    let list = [...(rows || [])];
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((r) => (r.title || "").toLowerCase().includes(q));
    if (typeFilter !== "all") list = list.filter((r) => r.test_type === typeFilter);
    if (bandFilter !== "all") list = list.filter((r) => band(Number(r.score) || 0) === bandFilter);
    list.sort((a, b) => {
      if (sort === "score") return (b.score || 0) - (a.score || 0);
      if (sort === "oldest") return new Date(a.completed_at) - new Date(b.completed_at);
      return new Date(b.completed_at) - new Date(a.completed_at); // recent
    });
    return list;
  }, [rows, query, typeFilter, bandFilter, sort]);

  useEffect(() => { setPage(1); }, [query, typeFilter, bandFilter, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <section className="testcenter th2">
      <header className="tc-head">
        <GlassButton type="button" size="icon" onClick={back} aria-label="Back"><ArrowLeft size={18} /></GlassButton>
        <div>
          <h1>{profileId ? `${studentName || "Student"} · Test History` : "My Test History"}</h1>
          <p>Every completed test with its full report. Search, filter and tap to review.</p>
        </div>
      </header>

      {error && <div className="tc-error">{error}</div>}
      {!rows && !error && <p className="tc-empty">Loading…</p>}

      {rows && rows.length === 0 && (
        <div className="tc-emptystate">
          <ClipboardList size={40} />
          <h2>No tests completed yet</h2>
          <p>{profileId ? "This student hasn't taken any tests." : "Once you finish a test, it will appear here."}</p>
        </div>
      )}

      {rows && rows.length > 0 && (
        <>
          <div className="th2-stats">
            <div className="th2-stat"><ClipboardList size={15} /><strong>{stats.total}</strong><span>Tests</span></div>
            <div className="th2-stat"><TrendingUp size={15} /><strong>{stats.avg}%</strong><span>Avg score</span></div>
            <div className="th2-stat"><Trophy size={15} /><strong>{stats.best}%</strong><span>Best</span></div>
            <div className="th2-stat"><CheckCircle2 size={15} /><strong>{stats.passRate}%</strong><span>Pass rate</span></div>
          </div>

          <div className="th2-toolbar">
            <div className="th2-search">
              <Search size={15} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by test title…" />
              {query && <button onClick={() => setQuery("")} aria-label="Clear"><X size={13} /></button>}
            </div>
            <label className="th2-select">
              <ListFilter size={13} />
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">All types</option>
                {types.map((t) => <option key={t} value={t}>{testTypeLabel(t)}</option>)}
              </select>
            </label>
            <label className="th2-select">
              <select value={bandFilter} onChange={(e) => setBandFilter(e.target.value)}>
                <option value="all">Any score</option>
                <option value="high">70%+</option>
                <option value="mid">50–69%</option>
                <option value="low">Below 50%</option>
              </select>
            </label>
            <label className="th2-select">
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="recent">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="score">Highest score</option>
              </select>
            </label>
          </div>

          <div className="th-list th2-list">
            {pageRows.map((r) => {
              const score = Number(r.score) || 0;
              return (
                <button key={r.id} type="button" className="th-row th2-row" onClick={() => openResult(r.id)}>
                  <div className={`th-score band-${band(score)}`}>{score}%</div>
                  <div className="th-main">
                    <strong>{r.title || "Test"}</strong>
                    <span className="th-meta">
                      {testTypeLabel(r.test_type)} · {r.correct ?? 0}/{r.total ?? 0} correct · {fmtDate(r.completed_at)}
                    </span>
                    <div className="th2-bar"><i className={`band-${band(score)}`} style={{ width: `${score}%` }} /></div>
                  </div>
                  <ChevronRight size={18} className="th-chevron" />
                </button>
              );
            })}
            {filtered.length === 0 && <p className="tc-empty">No tests match your search or filters.</p>}
          </div>

          {pageCount > 1 && (
            <div className="th2-pager">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={15} /> Prev</button>
              <span>Page {page} of {pageCount}</span>
              <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount}>Next <ChevronRight size={15} /></button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
