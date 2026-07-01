import { useNavigationController } from "../../hooks/useNavigationController";
import { useAdminController } from "../../hooks/useAdminController";
import React, { useState } from 'react';
import { ArrowLeft, CalendarDays, Download, LogOut, Mail, Upload, Users, Save, Check, Plus } from 'lucide-react';
import { Brand, Button, GlassButton, Pill } from '../ui/LegacyUI';
import { StudentManager } from "./StudentManager";

export default function BatchControl() {
  const { goToAdmin } = useNavigationController();
  const { batches, updateBatches, students } = useAdminController();
  const setBatches = updateBatches;
  const studentList = students || [];
  const fullCount = studentList.filter((s) => s.access === "full").length;
  const trialCount = studentList.length - fullCount;
  const [selected, setSelected] = useState(0);
  const [school, setSchool] = useState("");
  const [batchName, setBatchName] = useState("");
  const [showAll, setShowAll] = useState(true);

  const createBatch = () => {
    if (!school.trim() || !batchName.trim()) return;
    const code = `IBIS-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const newBatch = { id: code, school, name: batchName, code, count: 0 };
    setBatches([...batches, newBatch]);
    setSelected(batches.length);
    setSchool("");
    setBatchName("");
  };

  const activeBatch = batches[selected];

  return (
    <section className="batch-shell">
      <header className="topbar">
        <GlassButton type="button" size="icon" onClick={goToAdmin}><ArrowLeft size={18} /></GlassButton>
        <strong>Batch & Student Control</strong>
      </header>
      <div className="batch-grid">
        <aside className="batch-side">
          <article className="metric-card compact-card">
            <Users />
            <span>Total students</span>
            <strong>{studentList.length}</strong>
            <small>{batches.length} batch{batches.length === 1 ? "" : "es"} configured</small>
          </article>
          <article className="activity-card">
            <h3>Enrollment</h3>
            <p>{fullCount} full access</p>
            <p>{trialCount} on trial</p>
            <p>{studentList.length} total students</p>
          </article>
          <h3>Batch containers</h3>
          <button className={`batch-row ${showAll ? "active" : ""}`} onClick={() => setShowAll(true)}>
            <strong>All students</strong>
            <small>every batch · full access</small>
          </button>
          {batches.map((batch, index) => (
            <button className={`batch-row ${!showAll && index === selected ? "active" : ""}`} key={batch.id} onClick={() => { setSelected(index); setShowAll(false); }}>
              <strong>{batch.school} · {batch.name}</strong>
              <small>{batch.count} students · code {batch.code}</small>
            </button>
          ))}
          <div className="create-batch">
            <input value={school} onChange={(event) => setSchool(event.target.value)} placeholder="School name" />
            <input value={batchName} onChange={(event) => setBatchName(event.target.value)} placeholder="Batch name / year" />
            <Button variant="ghost" onClick={createBatch}><Plus size={16} /> Create batch</Button>
          </div>
        </aside>

        <StudentManager batches={batches} batchFilter={showAll ? null : activeBatch?.code} />
      </div>
    </section>
  );
}

