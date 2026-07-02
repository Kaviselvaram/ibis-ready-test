import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Plus, CircleDot, Circle, ArrowLeft, ChevronRight } from "lucide-react";
import { TestRepository, TEST_TYPES } from "../../repositories/TestRepository";
import { CourseRepository } from "../../repositories/CourseRepository";
import { useToast, friendlyMessage } from "../../contexts/ToastContext";
import { Button } from "../ui/LegacyUI";

const emptyDraft = () => ({
  title: "",
  test_type: "full_chapter",
  chapter_ids: [],
  question_count: 20,
  duration_minutes: 30,
  is_live: false
});

export default function TestCreate() {
  const navigate = useNavigate();
  const toast = useToast();
  const [chapters, setChapters] = useState([]);
  const [draft, setDraft] = useState(emptyDraft());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setChapters(await CourseRepository.getChapters() || []); }
    catch (e) { console.error("Load chapters failed:", e); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggleChapter = (id) => setDraft((d) => ({
    ...d,
    chapter_ids: d.chapter_ids.includes(id) ? d.chapter_ids.filter((x) => x !== id) : [...d.chapter_ids, id]
  }));

  const valid = draft.title.trim() && draft.chapter_ids.length > 0;

  const createTest = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      await toast.promise(() => TestRepository.createTest({
        ...draft,
        title: draft.title.trim(),
        question_count: Number(draft.question_count),
        duration_minutes: Number(draft.duration_minutes)
      }), {
        loading: "Creating test…", success: `Test “${draft.title.trim()}” created`,
        error: (e) => friendlyMessage(e, "Couldn’t create the test.")
      });
      navigate("/admin/tests");
    } catch (e) { setSaving(false); }
  };

  return (
    <div className="adminx-page">
      <nav className="content-breadcrumb">
        <Link to="/admin/tests"><ArrowLeft size={14} /> Tests</Link>
        <ChevronRight size={13} />
        <span>New test</span>
      </nav>

      <header className="adminx-pagehead">
        <div>
          <h1>New test</h1>
          <p>Configure a test. Questions are drawn from the Question Bank, filtered by the chapters you select.</p>
        </div>
      </header>

      <section className="tmx-createcard">
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

        <div className="tmx-createfoot">
          <button type="button" className="smx-btn-ghost" onClick={() => navigate("/admin/tests")}>Cancel</button>
          <button type="button" className="smx-btn-primary" onClick={createTest} disabled={saving || !valid}>
            <Plus size={16} /> {saving ? "Creating…" : "Create test"}
          </button>
        </div>
      </section>
    </div>
  );
}
