import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Plus, Trash2, Radio, Clock, Layers, Database } from "lucide-react";
import { TestRepository, testTypeLabel } from "../../repositories/TestRepository";
import { CourseRepository } from "../../repositories/CourseRepository";
import { Button } from "../ui/LegacyUI";

export default function TestManager() {
  const navigate = useNavigate();
  const [tests, setTests] = useState(null);
  const [chapters, setChapters] = useState([]);

  const load = useCallback(async () => {
    try {
      const [t, ch] = await Promise.all([TestRepository.listTests(), CourseRepository.getChapters()]);
      setTests(t || []);
      setChapters(ch || []);
    } catch (e) { console.error("Load tests failed:", e); setTests([]); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const chapterName = (id) => chapters.find((c) => c.id === id)?.name || "—";

  const toggleLive = async (t) => {
    try { await TestRepository.updateTest(t.id, { is_live: !t.is_live }); await load(); }
    catch (e) { console.error("Toggle live failed:", e); }
  };

  const removeTest = async (t) => {
    if (!window.confirm(`Delete test "${t.title}"?`)) return;
    try { await TestRepository.deleteTest(t.id); await load(); }
    catch (e) { console.error("Delete test failed:", e); }
  };

  const liveCount = (tests || []).filter((t) => t.is_live).length;

  return (
    <div className="adminx-page">
      <header className="adminx-pagehead">
        <div>
          <h1>Tests</h1>
          <p>Build tests from your chapters and publish them live. Students only see tests you set to Live.</p>
        </div>
        <div className="tmx-headactions">
          <div className="adminx-headstats">
            <div><strong>{tests?.length ?? "—"}</strong><span>Tests</span></div>
            <div><strong>{liveCount}</strong><span>Live</span></div>
          </div>
          <Button variant="secondary" onClick={() => navigate("/admin/tests/bank")}><Database size={16} /> Question bank</Button>
          <Button variant="primary" onClick={() => navigate("/admin/tests/new")}><Plus size={16} /> New test</Button>
        </div>
      </header>

      <section className="tmx-list">
        {!tests && <p className="tmx-empty">Loading…</p>}
        {tests && tests.length === 0 && (
          <div className="tmx-emptystate">
            <ClipboardList size={32} />
            <h2>No tests yet</h2>
            <p>Create your first test to publish it to students.</p>
            <Button variant="primary" onClick={() => navigate("/admin/tests/new")}><Plus size={16} /> New test</Button>
          </div>
        )}
        {(tests || []).map((t) => (
          <article key={t.id} className={`tmx-row ${t.is_live ? "live" : ""}`}>
            <div className="tmx-row-main">
              <div className="tmx-row-title">
                <strong>{t.title}</strong>
                <span className="tmx-type">{testTypeLabel(t.test_type)}</span>
              </div>
              <div className="tmx-row-meta">
                <span><Layers size={13} /> {t.chapter_ids?.length || 0} chapters</span>
                <span><ClipboardList size={13} /> {t.question_count} questions</span>
                <span><Clock size={13} /> {t.duration_minutes} min</span>
              </div>
              <div className="tmx-row-chapters">{(t.chapter_ids || []).map(chapterName).join(" · ") || "No chapters"}</div>
            </div>
            <div className="tmx-row-actions">
              <button className={`tmx-livebtn ${t.is_live ? "on" : ""}`} onClick={() => toggleLive(t)} title={t.is_live ? "Live — click to unpublish" : "Draft — click to publish"}>
                <Radio size={14} /> {t.is_live ? "Live" : "Draft"}
              </button>
              <button className="tmx-del" aria-label="Delete test" onClick={() => removeTest(t)}><Trash2 size={15} /></button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
