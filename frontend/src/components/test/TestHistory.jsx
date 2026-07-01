import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ClipboardList, ChevronRight } from "lucide-react";
import { TestRepository, testTypeLabel } from "../../repositories/TestRepository";
import { GlassButton } from "../ui/LegacyUI";

// Student's test history (and, for admins viewing ?student=<id>, that student's).
export default function TestHistory() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const profileId = search.get("student");        // set when an admin drills in
  const studentName = search.get("name");
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    TestRepository.history(profileId || undefined)
      .then((r) => active && setRows(r || []))
      .catch(() => active && setError("Could not load test history."));
    return () => { active = false; };
  }, [profileId]);

  const back = () => navigate(profileId ? "/admin/students" : "/student");
  const openResult = (id) => navigate(`/test-result/${id}${profileId ? "?from=admin" : ""}`);
  const band = (s) => (s >= 70 ? "high" : s >= 50 ? "mid" : "low");
  const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <section className="testcenter">
      <header className="tc-head">
        <GlassButton type="button" size="icon" onClick={back} aria-label="Back"><ArrowLeft size={18} /></GlassButton>
        <div>
          <h1>{profileId ? `${studentName || "Student"} · Test History` : "My Test History"}</h1>
          <p>Every completed test, with its full result report. Tap one to review.</p>
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

      <div className="th-list">
        {(rows || []).map((r) => (
          <button key={r.id} type="button" className="th-row" onClick={() => openResult(r.id)}>
            <div className={`th-score band-${band(r.score)}`}>{r.score}%</div>
            <div className="th-main">
              <strong>{r.title || "Test"}</strong>
              <span className="th-meta">
                {testTypeLabel(r.test_type)} · {r.correct ?? 0}/{r.total ?? 0} correct · {fmtDate(r.completed_at)}
              </span>
            </div>
            <ChevronRight size={18} className="th-chevron" />
          </button>
        ))}
      </div>
    </section>
  );
}
