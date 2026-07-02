import React, { useEffect, useState, useCallback } from "react";
import { ClipboardList, Plus, Trash2, Radio, CircleDot, Circle, Clock, Layers, X } from "lucide-react";
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
  const [creating, setCreating] = useState(false);
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
        <div className="adminx-headstats">
          <div><strong>{tests?.length ?? "—"}</strong><span>Tests</span></div>
          <div><strong>{liveCount}</strong><span>Live</span></div>
        </div>
      </header>

      <div className="tmx-actions">
        <Button variant="primary" onClick={() => setCreating(true)}><Plus size={16} /> New test</Button>
      </div>

      <section className="tmx-list">
        {!tests && <p className="tmx-empty">Loading…</p>}
        {tests && tests.length === 0 && (
          <div className="tmx-emptystate">
            <ClipboardList size={32} />
            <h2>No tests yet</h2>
            <p>Create your first test to publish it to students.</p>
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

      <section className="tmx-bank">
        <div className="tmx-bank-head">
          <h2><ClipboardList size={16} /> Question bank</h2>
          <p>Tests draw questions from this bank, filtered by the chapters you pick.</p>
        </div>
        <AdminQuestionBank questionBank={questionBank} setQuestionBank={updateQuestionBank} />
      </section>

      {creating && (
        <TestCreator
          chapters={chapters}
          onClose={() => setCreating(false)}
          onCreated={async () => { setCreating(false); await load(); }}
        />
      )}
    </div>
  );
}

function TestCreator({ chapters, onClose, onCreated }) {
  const [draft, setDraft] = useState(emptyDraft());
  const [saving, setSaving] = useState(false);

  const toggleChapter = (id) => setDraft((d) => ({
    ...d,
    chapter_ids: d.chapter_ids.includes(id) ? d.chapter_ids.filter((x) => x !== id) : [...d.chapter_ids, id]
  }));

  const valid = draft.title.trim() && draft.chapter_ids.length > 0;

  const createTest = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      await TestRepository.createTest({
        ...draft,
        title: draft.title.trim(),
        question_count: Number(draft.question_count),
        duration_minutes: Number(draft.duration_minutes)
      });
      await onCreated();
    } catch (e) { console.error("Create test failed:", e); setSaving(false); }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal tmx-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="smx-modal-close" aria-label="Close" onClick={onClose}><X size={18} /></button>
        <div className="tmx-modal-head"><h2><Plus size={18} /> New test</h2></div>

        <div className="tmx-modal-body">
          <label className="tm-field">
            <span>Title</span>
            <input value={draft.title} autoFocus onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Electrostatics — Full Chapter" />
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
                <button type="button" key={c.id} className={`tm-chip ${draft.chapter_ids.includes(c.id) ? "on" : ""}`} onClick={() => toggleChapter(c.id)}>
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
        </div>

        <div className="tmx-modal-foot">
          <button type="button" className="smx-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="smx-btn-primary" onClick={createTest} disabled={saving || !valid}>
            <Plus size={16} /> {saving ? "Creating…" : "Create test"}
          </button>
        </div>
      </div>
    </div>
  );
}
