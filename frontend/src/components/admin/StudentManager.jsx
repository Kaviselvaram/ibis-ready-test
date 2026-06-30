import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2, Edit3, Mail, Phone, Plus, Save, Search, Trash2, TrendingUp, UserPlus, X,
} from "lucide-react";
import { blankStudent, ACCESS_LEVELS, PAYMENT_STATES } from "../../repositories/StudentRepository";
import { useAdminController } from "../../hooks/useAdminController";

const initials = (name) => name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "?";

export function StudentManager({ batches, batchFilter }) {
  const { students, updateStudents } = useAdminController();
  const setStudents = updateStudents;
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null); // student object being edited (or new)
  const [isNew, setIsNew] = useState(false);

  

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (batchFilter && s.batchCode !== batchFilter) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.batchCode || "").toLowerCase().includes(q);
    });
  }, [students, query, batchFilter]);

  const openEdit = (student) => { setEditing(JSON.parse(JSON.stringify(student))); setIsNew(false); };
  const openNew = () => { setEditing(blankStudent()); setIsNew(true); };

  const save = (student) => {
    const exists = students.some((s) => s.id === student.id);
    const newStudents = exists ? students.map((s) => (s.id === student.id ? student : s)) : [...students, student];
    setStudents(newStudents);
    setEditing(null);
  };

  const remove = (id) => {
    if (window.confirm("Remove this student permanently?")) {
      const newStudents = students.filter((s) => s.id !== id);
      setStudents(newStudents);
    }
  };

  return (
    <section className="student-table">
      <div className="sm-head">
        <div>
          <h2>Student records</h2>
          <small>{filtered.length} student{filtered.length !== 1 ? "s" : ""}{batchFilter ? ` · ${batchFilter}` : " · all batches"} · full edit access</small>
        </div>
        <div className="sm-head-actions">
          <div className="sm-search">
            <Search size={15} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, batch" />
          </div>
          <button type="button" className="sm-add-btn" onClick={openNew}><UserPlus size={16} /> Add student</button>
        </div>
      </div>

      <div className="sm-list">
        {filtered.length === 0 && <p className="sm-empty">No students match.</p>}
        {filtered.map((s) => (
          <article key={s.id} className="sm-row">
            <span className="sm-avatar">{initials(s.name)}</span>
            <div className="sm-main">
              <strong>{s.name || "Unnamed"}</strong>
              <span className="sm-sub">{s.email || "no email"} · {s.batchCode || "no batch"}</span>
            </div>
            <div className="sm-metrics">
              <span><b>{s.accuracy}%</b>accuracy</span>
              <span><b>{s.avgScore}</b>avg score</span>
              <span><b>{s.testsTaken}</b>tests</span>
            </div>
            <span className={`sm-pill ${s.access === "full" ? "full" : "trial"}`}>{s.access}</span>
            <span className={`sm-pay sm-pay-${s.paymentStatus.toLowerCase()}`}>{s.paymentStatus}</span>
            <div className="sm-row-actions">
              <button type="button" aria-label="Edit student" onClick={() => openEdit(s)}><Edit3 size={15} /></button>
              <button type="button" aria-label="Delete student" onClick={() => remove(s.id)}><Trash2 size={15} /></button>
            </div>
          </article>
        ))}
      </div>

      {editing && (
        <StudentEditor
          student={editing}
          isNew={isNew}
          batches={batches}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}
    </section>
  );
}

function StudentEditor({ student, isNew, batches, onCancel, onSave }) {
  const [draft, setDraft] = useState(student);
  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  const setNum = (key, value) => set(key, Number(value) || 0);

  const setProgress = (i, key, value) =>
    setDraft((d) => ({ ...d, progress: d.progress.map((p, idx) => (idx === i ? { ...p, [key]: key === "percent" ? Number(value) || 0 : value } : p)) }));
  const addProgress = () => setDraft((d) => ({ ...d, progress: [...d.progress, { chapter: "", percent: 0 }] }));
  const removeProgress = (i) => setDraft((d) => ({ ...d, progress: d.progress.filter((_, idx) => idx !== i) }));

  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal sm-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="sm-modal-close" aria-label="Close" onClick={onCancel}><X size={18} /></button>
        <div className="sm-modal-head">
          <span className="sm-avatar lg">{initials(draft.name || "?")}</span>
          <div>
            <h2>{isNew ? "Add student" : "Edit student"}</h2>
            <small>All fields are editable by the admin.</small>
          </div>
        </div>

        <div className="sm-modal-body">
          <div className="sm-grid">
            <Field label="Full name"><input value={draft.name} onChange={(e) => set("name", e.target.value)} /></Field>
            <Field label="Email"><div className="sm-input-ico"><Mail size={14} /><input value={draft.email} onChange={(e) => set("email", e.target.value)} /></div></Field>
            <Field label="Phone"><div className="sm-input-ico"><Phone size={14} /><input value={draft.phone} onChange={(e) => set("phone", e.target.value)} /></div></Field>
            <Field label="School"><input value={draft.school} onChange={(e) => set("school", e.target.value)} /></Field>
            <Field label="Grade"><input value={draft.grade} onChange={(e) => set("grade", e.target.value)} /></Field>
            <Field label="Batch">
              <select value={draft.batchCode} onChange={(e) => set("batchCode", e.target.value)}>
                <option value="">— none —</option>
                {batches?.map((b) => <option key={b.code} value={b.code}>{b.code} · {b.name}</option>)}
              </select>
            </Field>
            <Field label="Access level">
              <select value={draft.access} onChange={(e) => set("access", e.target.value)}>
                {Object.values(ACCESS_LEVELS).map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="Payment status">
              <select value={draft.paymentStatus} onChange={(e) => set("paymentStatus", e.target.value)}>
                {Object.values(PAYMENT_STATES).map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Join date"><input type="date" value={draft.joinDate} onChange={(e) => set("joinDate", e.target.value)} /></Field>
            <Field label="Last active"><input value={draft.lastActive} onChange={(e) => set("lastActive", e.target.value)} /></Field>
          </div>

          <div className="sm-section-title"><TrendingUp size={15} /> Performance</div>
          <div className="sm-grid sm-grid-tight">
            <Field label="Accuracy %"><input type="number" value={draft.accuracy} onChange={(e) => setNum("accuracy", e.target.value)} /></Field>
            <Field label="Avg score"><input type="number" value={draft.avgScore} onChange={(e) => setNum("avgScore", e.target.value)} /></Field>
            <Field label="Rank"><input type="number" value={draft.rank} onChange={(e) => setNum("rank", e.target.value)} /></Field>
            <Field label="Tests taken"><input type="number" value={draft.testsTaken} onChange={(e) => setNum("testsTaken", e.target.value)} /></Field>
            <Field label="Study (hrs)"><input type="number" value={draft.studyTimeHrs} onChange={(e) => setNum("studyTimeHrs", e.target.value)} /></Field>
            <Field label="Badges"><input type="number" value={draft.badges} onChange={(e) => setNum("badges", e.target.value)} /></Field>
          </div>

          <label className="sm-toggle">
            <input type="checkbox" checked={draft.notesUnlocked} onChange={(e) => set("notesUnlocked", e.target.checked)} />
            <span>Notes &amp; downloadable files unlocked for this student</span>
          </label>

          <div className="sm-section-title">
            <span>Chapter progress</span>
            <button type="button" className="sm-mini-add" onClick={addProgress}><Plus size={13} /> Add</button>
          </div>
          {draft.progress.length === 0 && <p className="sm-empty">No progress recorded.</p>}
          {draft.progress.map((p, i) => (
            <div key={i} className="sm-progress-row">
              <input className="sm-progress-name" value={p.chapter} placeholder="Chapter name" onChange={(e) => setProgress(i, "chapter", e.target.value)} />
              <input className="sm-progress-pct" type="number" value={p.percent} onChange={(e) => setProgress(i, "percent", e.target.value)} />
              <span>%</span>
              <button type="button" aria-label="Remove" onClick={() => removeProgress(i)}><Trash2 size={13} /></button>
            </div>
          ))}

          {draft.testHistory.length > 0 && (
            <>
              <div className="sm-section-title">Test history</div>
              <div className="sm-history">
                {draft.testHistory.map((t, i) => (
                  <div key={i} className="sm-history-row">
                    <CheckCircle2 size={13} />
                    <span>{t.name}</span>
                    <i>{t.date}</i>
                    <b>{t.score}/{t.total}</b>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="sm-modal-foot">
          <button type="button" className="qt-nav-btn" onClick={onCancel}>Cancel</button>
          <button type="button" className="sm-save-btn" onClick={() => onSave(draft)} disabled={!draft.name.trim()}>
            <Save size={16} /> {isNew ? "Add student" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="sm-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
