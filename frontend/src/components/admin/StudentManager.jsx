import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Edit3, Mail, Phone, Save, Search, Trash2, X, School, GraduationCap, Users } from "lucide-react";
import { useAdminController } from "../../hooks/useAdminController";
import { useToast, friendlyMessage } from "../../contexts/ToastContext";

const PAGE_SIZE = 25;
const initials = (name) => (name || "").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "?";

// Map a student's paymentStatus to a coarse status bucket used by the filters.
function statusOf(s) {
  if (s.paymentStatus === "Paid" || s.access === "full") return "paid";
  if (s.paymentStatus === "Unpaid" || s.paymentStatus === "Refunded") return "pending";
  return "trial";
}
const STATUS_META = {
  paid: { label: "Paid", cls: "paid" },
  trial: { label: "Trial", cls: "trial" },
  pending: { label: "Pending Approval", cls: "pending" }
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "trial", label: "Trial" },
  { key: "pending", label: "Pending Approval" }
];

export function StudentManager({ batches, batchFilter }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { students, updateStudents, removeStudent } = useAdminController();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [editing, setEditing] = useState(null);

  // Reset pagination whenever the filter/search/roster changes.
  useEffect(() => { setVisible(PAGE_SIZE); }, [query, filter, batchFilter, students.length]);

  const counts = useMemo(() => {
    const base = students.filter((s) => !batchFilter || s.batchCode === batchFilter);
    return {
      all: base.length,
      paid: base.filter((s) => statusOf(s) === "paid").length,
      trial: base.filter((s) => statusOf(s) === "trial").length,
      pending: base.filter((s) => statusOf(s) === "pending").length
    };
  }, [students, batchFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      if (batchFilter && s.batchCode !== batchFilter) return false;
      if (filter !== "all" && statusOf(s) !== filter) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.batchCode || "").toLowerCase().includes(q);
    });
  }, [students, query, filter, batchFilter]);

  const page = filtered.slice(0, visible);

  const save = (student) => {
    const exists = students.some((s) => s.id === student.id);
    const next = exists ? students.map((s) => (s.id === student.id ? student : s)) : [...students, student];
    setEditing(null);
    toast.promise(() => updateStudents(next), {
      loading: "Saving…", success: "Student updated", error: (e) => friendlyMessage(e, "Couldn’t save changes.")
    }).catch(() => {});
  };

  const remove = async (s) => {
    if (!window.confirm(`Permanently delete ${s.name || s.email}? This removes their account and cannot be undone.`)) return;
    await toast.promise(async () => { const ok = await removeStudent(s.id); if (!ok) throw new Error("Delete failed"); }, {
      loading: "Deleting student…", success: `${s.name || "Student"} deleted`, error: (e) => friendlyMessage(e, "Couldn’t delete the student.")
    }).catch(() => {});
  };

  return (
    <section className="smx">
      <div className="smx-toolbar">
        <div className="smx-filters">
          {FILTERS.map((f) => (
            <button key={f.key} className={`smx-filter ${filter === f.key ? "active" : ""}`} onClick={() => setFilter(f.key)}>
              {f.label} <span className="smx-filter-count">{counts[f.key]}</span>
            </button>
          ))}
        </div>
        <div className="smx-search">
          <Search size={15} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email or batch…" />
        </div>
      </div>

      <div className="smx-table">
        <div className="smx-thead">
          <span className="smx-col-student">Student</span>
          <span className="smx-col-batch">Batch</span>
          <span className="smx-col-tests">Tests</span>
          <span className="smx-col-status">Status</span>
          <span className="smx-col-actions" />
        </div>

        {filtered.length === 0 ? (
          <div className="smx-empty"><Users size={30} /><p>No students match this view.</p></div>
        ) : (
          page.map((s) => {
            const st = STATUS_META[statusOf(s)];
            return (
              <div key={s.id} className="smx-row">
                <div className="smx-col-student">
                  <span className="smx-avatar">{initials(s.name)}</span>
                  <div className="smx-ident">
                    <strong>{s.name || "Unnamed"}</strong>
                    <small>{s.email || "no email"}</small>
                  </div>
                </div>
                <div className="smx-col-batch">{s.batchCode || <span className="smx-muted">—</span>}</div>
                <div className="smx-col-tests">{s.testsTaken || 0}</div>
                <div className="smx-col-status"><span className={`smx-status ${st.cls}`}>{st.label}</span></div>
                <div className="smx-col-actions">
                  <button aria-label="Test history" title="Test history"
                    onClick={() => navigate(`/test-history?student=${s.id}&name=${encodeURIComponent(s.name || "Student")}`)}>
                    <ClipboardList size={15} />
                  </button>
                  <button aria-label="Edit" title="Edit" onClick={() => setEditing(JSON.parse(JSON.stringify(s)))}><Edit3 size={15} /></button>
                  <button aria-label="Delete" title="Delete" className="danger" onClick={() => remove(s)}><Trash2 size={15} /></button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {filtered.length > 0 && (
        <div className="smx-foot">
          <span>Showing {page.length} of {filtered.length}</span>
          {visible < filtered.length && (
            <button className="smx-loadmore" onClick={() => setVisible((v) => v + PAGE_SIZE)}>Load more</button>
          )}
        </div>
      )}

      {editing && (
        <StudentEditor student={editing} batches={batches} onCancel={() => setEditing(null)} onSave={save} />
      )}
    </section>
  );
}

function StudentEditor({ student, batches, onCancel, onSave }) {
  const [draft, setDraft] = useState(student);
  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }));

  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal smx-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="smx-modal-close" aria-label="Close" onClick={onCancel}><X size={18} /></button>
        <div className="smx-modal-head">
          <span className="smx-avatar lg">{initials(draft.name || "?")}</span>
          <div>
            <h2>Edit student</h2>
            <small>Changes save to the student's profile.</small>
          </div>
        </div>

        <div className="smx-modal-body">
          <label className="smx-field">
            <span>Full name</span>
            <input value={draft.name} onChange={(e) => set("name", e.target.value)} />
          </label>
          <label className="smx-field">
            <span>Email <em>(read-only)</em></span>
            <div className="smx-input-ico"><Mail size={14} /><input value={draft.email} readOnly disabled /></div>
          </label>
          <label className="smx-field">
            <span>Phone</span>
            <div className="smx-input-ico"><Phone size={14} /><input value={draft.phone} onChange={(e) => set("phone", e.target.value)} /></div>
          </label>
          <label className="smx-field">
            <span>School</span>
            <div className="smx-input-ico"><School size={14} /><input value={draft.school} onChange={(e) => set("school", e.target.value)} /></div>
          </label>
          <label className="smx-field">
            <span>Grade</span>
            <div className="smx-input-ico"><GraduationCap size={14} /><input value={draft.grade} onChange={(e) => set("grade", e.target.value)} /></div>
          </label>
          <label className="smx-field">
            <span>Batch</span>
            <select value={draft.batchCode} onChange={(e) => set("batchCode", e.target.value)}>
              <option value="">— none —</option>
              {batches?.map((b) => <option key={b.code} value={b.code}>{b.code} · {b.name}</option>)}
            </select>
          </label>
        </div>

        <div className="smx-modal-foot">
          <button type="button" className="smx-btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="button" className="smx-btn-primary" onClick={() => onSave(draft)} disabled={!draft.name.trim()}>
            <Save size={16} /> Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
