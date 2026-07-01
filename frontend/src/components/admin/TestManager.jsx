import React, { useEffect, useState, useCallback } from "react";
import { ClipboardList, Plus, Trash2, Radio, CircleDot, Circle, Clock, Layers } from "lucide-react";
import { TestRepository, TEST_TYPES, testTypeLabel } from "../../repositories/TestRepository";
import { CourseRepository } from "../../repositories/CourseRepository";
import { useAdminController } from "../../hooks/useAdminController";
import { AdminQuestionBank } from "../test/AdminQuestionBank";
import { Button } from "../ui/LegacyUI";

const emptyDraft = () => ({
  title: "",
  test_type: "full_chapter",
  chapter_ids: [],
  question_count: 20,
  duration_minutes: 30,
  is_live: false
});

export default function TestManager() {
  const [tests, setTests] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [draft, setDraft] = useState(emptyDraft());
  const [saving, setSaving] = useState(false);
  const { questionBank, updateQuestionBank } = useAdminController();

  const load = useCallback(async () => {
    try {
      const [t, ch] = await Promise.all([TestRepository.listTests(), CourseRepository.getChapters()]);
      setTests(t || []);
      setChapters(ch || []);
    } catch (e) { console.error("Load tests failed:", e); setTests([]); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const chapterName = (id) => chapters.find((c) => c.id === id)?.name || "—";

  const toggleChapter = (id) => setDraft((d) => ({
    ...d,
    chapter_ids: d.chapter_ids.includes(id) ? d.chapter_ids.filter((x) => x !== id) : [...d.chapter_ids, id]
  }));

  const createTest = async () => {
    if (!draft.title.trim() || draft.chapter_ids.length === 0) return;
    setSaving(true);
    try {
      await TestRepository.createTest({
        ...draft,
        title: draft.title.trim(),
        question_count: Number(draft.question_count),
        duration_minutes: Number(draft.duration_minutes)
      });
      setDraft(emptyDraft());
      await load();
    } catch (e) { console.error("Create test failed:", e); }
    finally { setSaving(false); }
  };

  const toggleLive = async (t) => {
    try { await TestRepository.updateTest(t.id, { is_live: !t.is_live }); await load(); }
    catch (e) { console.error("Toggle live failed:", e); }
  };

  const removeTest = async (t) => {
    if (!window.confirm(`Delete test "${t.title}"?`)) return;
    try { await TestRepository.deleteTest(t.id); await load(); }
    catch (e) { console.error("Delete test failed:", e); }
  };

  return (
    <div className="adminx-page">
      <header className="adminx-pagehead">
        <div>
          <h1>Tests</h1>
          <p>Create tests from your chapters and publish them live. Students only see tests you set to Live.</p>
        </div>
      </header>

      <div className="tm-grid">
        {/* Create panel */}
        <section className="tm-card tm-create">
          <h2><Plus size={16} /> New test</h2>
          <label className="tm-field">
            <span>Title</span>
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Electrostatics — Full Chapter" />
          </label>

          <div className="tm-field-row">
            <label className="tm-field">
              <span>Type</span>
              <select value={draft.test_type} onChange={(e) => setDraft({ ...draft, test_type: e.target.value })}>
                {TEST_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </label>
            <label className="tm-field">
              <span>Questions</span>
              <input type="number" min="1" max="200" value={draft.question_count} onChange={(e) => setDraft({ ...draft, question_count: e.target.value })} />
            </label>
            <label className="tm-field">
              <span>Minutes</span>
              <input type="number" min="1" max="600" value={draft.duration_minutes} onChange={(e) => setDraft({ ...draft, duration_minutes: e.target.value })} />
            </label>
          </div>

          <div className="tm-field">
            <span>Chapters <small>({draft.chapter_ids.length} selected)</small></span>
            <div className="tm-chapter-picker">
              {chapters.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  className={`tm-chip ${draft.chapter_ids.includes(c.id) ? "on" : ""}`}
                  onClick={() => toggleChapter(c.id)}
                >
                  {draft.chapter_ids.includes(c.id) ? <CircleDot size={13} /> : <Circle size={13} />}
                  {c.name}
                </button>
              ))}
              {chapters.length === 0 && <p className="tm-empty">Add chapters in Content first.</p>}
            </div>
          </div>

          <label className="tm-live-toggle">
            <input type="checkbox" checked={draft.is_live} onChange={(e) => setDraft({ ...draft, is_live: e.target.checked })} />
            <span>Publish live immediately</span>
          </label>

          <Button variant="primary" onClick={createTest} disabled={saving || !draft.title.trim() || draft.chapter_ids.length === 0}>
            <Plus size={16} /> Create test
          </Button>
        </section>

        {/* List panel */}
        <section className="tm-card tm-list">
          <h2><ClipboardList size={16} /> Tests {tests ? `(${tests.length})` : ""}</h2>
          {!tests && <p className="tm-empty">Loading…</p>}
          {tests && tests.length === 0 && <p className="tm-empty">No tests yet. Create one on the left.</p>}
          <div className="tm-rows">
            {(tests || []).map((t) => (
              <article key={t.id} className={`tm-row ${t.is_live ? "live" : ""}`}>
                <div className="tm-row-main">
                  <strong>{t.title}</strong>
                  <div className="tm-row-meta">
                    <span className="tm-tag">{testTypeLabel(t.test_type)}</span>
                    <span><Layers size={12} /> {t.chapter_ids?.length || 0} ch</span>
                    <span><ClipboardList size={12} /> {t.question_count} Q</span>
                    <span><Clock size={12} /> {t.duration_minutes}m</span>
                  </div>
                  <div className="tm-row-chapters">{(t.chapter_ids || []).map(chapterName).join(" · ") || "No chapters"}</div>
                </div>
                <div className="tm-row-actions">
                  <button className={`tm-livebtn ${t.is_live ? "on" : ""}`} onClick={() => toggleLive(t)} title={t.is_live ? "Live — click to unpublish" : "Draft — click to publish"}>
                    <Radio size={14} /> {t.is_live ? "Live" : "Draft"}
                  </button>
                  <button className="tm-del" aria-label="Delete test" onClick={() => removeTest(t)}><Trash2 size={14} /></button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="tm-card tm-bank">
        <h2><ClipboardList size={16} /> Question bank</h2>
        <p className="tm-bank-note">Tests draw their questions from this bank, filtered by the chapters you pick above.</p>
        <AdminQuestionBank questionBank={questionBank} setQuestionBank={updateQuestionBank} />
      </section>
    </div>
  );
}
