import React, { useMemo, useRef, useState } from "react";
import { X, Upload, FileText, Download, CheckCircle2, AlertCircle, Users, Mail } from "lucide-react";
import { parseStudentsCsv, toCsv, downloadCsv } from "../../utils/csv";
import { StudentRepository } from "../../repositories/StudentRepository";

const SAMPLE = "full_name,email,phone,grade,batch_code\nAsha Rao,asha@example.com,9876543210,Class 12,IBIS-AB12\nRahul Nair,rahul@example.com,9876500000,Class 11,";
const SAMPLE_JSON = JSON.stringify([
  { full_name: "Asha Rao", email: "asha@example.com", phone: "9876543210", grade: "Class 12", batch_code: "IBIS-AB12" },
  { full_name: "Rahul Nair", email: "rahul@example.com", grade: "Class 11" }
], null, 2);

// Parse a pasted/uploaded JSON array of students into the same row shape the
// bulk endpoint expects, with per-entry validation (#12).
function parseStudentsJson(text) {
  const out = { rows: [], errors: [] };
  if (!text.trim()) return out;
  let data;
  try { data = JSON.parse(text); } catch (e) { out.errors.push({ line: 1, reason: `Invalid JSON: ${e.message}` }); return out; }
  const arr = Array.isArray(data) ? data : [data];
  arr.forEach((r, i) => {
    const email = String(r?.email || "").trim();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { out.errors.push({ line: i + 1, reason: "Missing/invalid email" }); return; }
    out.rows.push({
      full_name: String(r.full_name || r.name || "").trim(),
      email,
      phone: String(r.phone || "").trim(),
      grade: String(r.grade || "").trim(),
      batch_code: String(r.batch_code || r.batchCode || "").trim()
    });
  });
  return out;
}

export default function BulkUploadModal({ onClose, onComplete }) {
  const [text, setText] = useState("");
  const [mode, setMode] = useState("csv"); // csv | json
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { summary, results }
  const fileRef = useRef(null);

  const { rows, errors } = useMemo(
    () => (mode === "json" ? parseStudentsJson(text) : parseStudentsCsv(text)),
    [text, mode]
  );

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result || ""));
    reader.readAsText(file);
  };

  const submit = async () => {
    if (rows.length === 0) return;
    setSubmitting(true);
    try {
      const res = await StudentRepository.bulkUpload(rows, true);
      setResult(res);
      onComplete?.();
    } catch (e) {
      setResult({ error: e?.cause?.message || "Upload failed. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const downloadCreds = () => {
    const created = (result?.results || []).filter((r) => r.status === "created");
    const csv = toCsv(
      ["full_name", "email", "temp_password", "emailed"],
      created.map((r) => ({ full_name: r.name, email: r.email, temp_password: r.password, emailed: r.emailed ? "yes" : "no" }))
    );
    downloadCsv(`ibis-credentials-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal bulk-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="smx-modal-close" aria-label="Close" onClick={onClose}><X size={18} /></button>

        {!result ? (
          <>
            <div className="bulk-head">
              <h2><Upload size={18} /> Bulk add students</h2>
              <p>Paste or upload <b>CSV</b> or <b>JSON</b>. Fields: <code>full_name, email, phone, grade, batch_code</code>. Each student gets a generated password and (if email is configured) their credentials by email. Duplicates and invalid rows are reported, not blocked.</p>
            </div>

            <div className="bulk-modeswitch" role="group" aria-label="Import format">
              <button type="button" className={mode === "csv" ? "active" : ""} onClick={() => setMode("csv")}>CSV</button>
              <button type="button" className={mode === "json" ? "active" : ""} onClick={() => setMode("json")}>JSON</button>
            </div>

            <div className="bulk-tools">
              <button type="button" className="bulk-tool" onClick={() => fileRef.current?.click()}>
                <FileText size={15} /> Upload {mode === "json" ? "JSON" : "CSV"} file
              </button>
              <button type="button" className="bulk-tool" onClick={() => setText(mode === "json" ? SAMPLE_JSON : SAMPLE)}>Insert sample</button>
              <input ref={fileRef} type="file" accept={mode === "json" ? ".json,application/json" : ".csv,text/csv"} hidden onChange={onFile} />
            </div>

            <textarea
              className="bulk-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={mode === "json" ? SAMPLE_JSON : "full_name,email,phone,grade,batch_code\nAsha Rao,asha@example.com,9876543210,Class 12,IBIS-AB12"}
              spellCheck={false}
            />

            <div className="bulk-parsestat">
              <span className="ok"><CheckCircle2 size={14} /> {rows.length} valid row{rows.length === 1 ? "" : "s"}</span>
              {errors.length > 0 && <span className="warn"><AlertCircle size={14} /> {errors.length} skipped</span>}
            </div>
            {errors.length > 0 && (
              <ul className="bulk-errors">
                {errors.slice(0, 4).map((e, i) => <li key={i}>Line {e.line}: {e.reason}</li>)}
                {errors.length > 4 && <li>…and {errors.length - 4} more</li>}
              </ul>
            )}

            <div className="bulk-foot">
              <button type="button" className="smx-btn-ghost" onClick={onClose}>Cancel</button>
              <button type="button" className="smx-btn-primary" onClick={submit} disabled={submitting || rows.length === 0}>
                <Users size={16} /> {submitting ? "Creating accounts…" : `Create ${rows.length} account${rows.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </>
        ) : result.error ? (
          <div className="bulk-result">
            <AlertCircle size={34} className="bulk-result-icon err" />
            <h2>Upload failed</h2>
            <p>{result.error}</p>
            <div className="bulk-foot"><button type="button" className="smx-btn-ghost" onClick={onClose}>Close</button></div>
          </div>
        ) : (
          <div className="bulk-result">
            <CheckCircle2 size={34} className="bulk-result-icon ok" />
            <h2>Import complete</h2>
            <div className="bulk-summary">
              <div><strong>{result.summary.created}</strong><span>Created</span></div>
              <div><strong>{result.summary.skipped}</strong><span>Skipped</span></div>
              <div><strong>{result.summary.failed}</strong><span>Failed</span></div>
            </div>
            <p className="bulk-emailnote">
              <Mail size={14} /> {result.summary.emailSent
                ? "Credentials emailed to each new student."
                : "Email not configured — download the credentials CSV below and share it securely."}
            </p>
            {result.summary.created > 0 && (
              <button type="button" className="smx-btn-primary bulk-download" onClick={downloadCreds}>
                <Download size={16} /> Download credentials CSV
              </button>
            )}
            {result.results.some((r) => r.status !== "created") && (
              <ul className="bulk-errors">
                {result.results.filter((r) => r.status !== "created").slice(0, 5).map((r, i) => (
                  <li key={i}>{r.email}: {r.error || r.status}</li>
                ))}
              </ul>
            )}
            <div className="bulk-foot"><button type="button" className="smx-btn-ghost" onClick={onClose}>Done</button></div>
          </div>
        )}
      </div>
    </div>
  );
}
