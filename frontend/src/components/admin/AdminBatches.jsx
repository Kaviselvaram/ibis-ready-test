import React, { useMemo, useState } from "react";
import { Boxes, Plus, Users, Copy, Check, School, Upload, Trash2, Pause, Play } from "lucide-react";
import { useAdminController } from "../../hooks/useAdminController";
import { Button } from "../ui/LegacyUI";
import BulkUploadModal from "./BulkUploadModal";

function genCode() {
  return `IBIS-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export default function AdminBatches() {
  const { batches, updateBatches, removeBatch, students, refreshStudentsAndBatches } = useAdminController();
  const list = batches || [];
  const studentList = students || [];

  const [school, setSchool] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);

  const totalInBatches = useMemo(() => list.reduce((n, b) => n + (b.count || 0), 0), [list]);

  const createBatch = async () => {
    if (!school.trim() || !name.trim()) { setError("School and batch name are required."); return; }
    setError("");
    setSaving(true);
    try {
      // New batch has no id — the backend generates the uuid on insert.
      const next = [...list, { code: genCode(), name: name.trim(), school: school.trim(), status: "Active", count: 0 }];
      await updateBatches(next);
      setSchool("");
      setName("");
    } catch (e) {
      setError("Could not create batch. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(""), 1500);
    } catch { /* clipboard unavailable */ }
  };

  const toggleStatus = (b) => {
    const next = (b.status || "Active") === "Active" ? "Paused" : "Active";
    updateBatches(list.map((x) => (x.id === b.id ? { ...x, status: next } : x)));
  };

  const deleteBatch = (b) => {
    if (window.confirm(`Delete batch "${b.name}"? Students in it will be unassigned (their accounts stay).`)) {
      removeBatch(b.id);
    }
  };

  return (
    <div className="adminx-page">
      <header className="adminx-pagehead">
        <div>
          <h1>Batches</h1>
          <p>Organise students into school batches. Share the batch code so enrolments land in the right group.</p>
        </div>
        <div className="bx-headright">
          <div className="adminx-headstats">
            <div><strong>{list.length}</strong><span>Batches</span></div>
            <div><strong>{studentList.length}</strong><span>Students</span></div>
          </div>
          <Button variant="primary" onClick={() => setBulkOpen(true)}><Upload size={16} /> Bulk add students</Button>
        </div>
      </header>

      <div className="bx-create">
        <div className="bx-create-field">
          <span><School size={14} /> School</span>
          <input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="e.g. Delhi Public School" />
        </div>
        <div className="bx-create-field">
          <span><Boxes size={14} /> Batch name / year</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Class XII — 2026" onKeyDown={(e) => e.key === "Enter" && createBatch()} />
        </div>
        <Button variant="primary" onClick={createBatch} disabled={saving}>
          <Plus size={16} /> {saving ? "Creating…" : "Create batch"}
        </Button>
      </div>
      {error && <p className="bx-error">{error}</p>}

      {list.length === 0 ? (
        <div className="bx-empty">
          <Boxes size={34} />
          <h2>No batches yet</h2>
          <p>Create your first batch above to start grouping students.</p>
        </div>
      ) : (
        <div className="bx-grid">
          {list.map((b) => (
            <article className="bx-card" key={b.id || b.code}>
              <div className="bx-card-head">
                <span className="bx-card-icon"><Boxes size={18} /></span>
                <span className={`bx-status ${(b.status || "Active").toLowerCase()}`}>{b.status || "Active"}</span>
              </div>
              <h3>{b.name}</h3>
              <p className="bx-school">{b.school}</p>
              <div className="bx-card-foot">
                <span className="bx-count"><Users size={14} /> {b.count || 0} student{(b.count || 0) === 1 ? "" : "s"}</span>
                <button className="bx-code" onClick={() => copyCode(b.code)} title="Copy batch code">
                  {b.code} {copied === b.code ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
              <div className="bx-card-actions">
                <button onClick={() => toggleStatus(b)} title={(b.status || "Active") === "Active" ? "Pause batch" : "Activate batch"}>
                  {(b.status || "Active") === "Active" ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Activate</>}
                </button>
                <button className="danger" onClick={() => deleteBatch(b)} title="Delete batch"><Trash2 size={13} /> Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}

      {bulkOpen && (
        <BulkUploadModal
          onClose={() => setBulkOpen(false)}
          onComplete={refreshStudentsAndBatches}
        />
      )}
    </div>
  );
}
