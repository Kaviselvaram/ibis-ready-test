import React, { useMemo, useRef, useState } from "react";
import { X, Upload, FileText, Download, CheckCircle2, AlertCircle, Users, Mail } from "lucide-react";
import { parseStudentsCsv, toCsv, downloadCsv } from "../../utils/csv";
import { StudentRepository } from "../../repositories/StudentRepository";

const SAMPLE = "full_name,email,phone,grade,batch_code\nAsha Rao,asha@example.com,9876543210,Class 12,IBIS-AB12\nRahul Nair,rahul@example.com,9876500000,Class 11,";

export default function BulkUploadModal({ onClose, onComplete }) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { summary, results }
  const fileRef = useRef(null);

  const { rows, errors } = useMemo(() => parseStudentsCsv(text), [text]);

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
              <p>Paste rows or upload a CSV. Columns: <code>full_name, email, phone, grade, batch_code</code>. Each student gets a generated password and (if email is configured) their credentials by email.</p>
            </div>

            <div className="bulk-tools">
              <button type="button" className="bulk-tool" onClick={() => fileRef.current?.click()}><FileText size={15} /> Upload CSV file</button>
              <button type="button" className="bulk-tool" onClick={() => setText(SAMPLE)}>Insert sample</button>
              <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={onFile} />
            </div>

            <textarea
              className="bulk-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"full_name,email,phone,grade,batch_code\nAsha Rao,asha@example.com,9876543210,Class 12,IBIS-AB12"}
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
