import React, { useState } from "react";
import { FileText, Trash2, Upload, Play, Check, X, CloudUpload, Loader2, AlertTriangle, ExternalLink } from "lucide-react";
import { getYouTubeThumbnail, getYouTubeId, getYouTubeEmbed } from "../../utils/youtube";
import { Button } from "../ui/LegacyUI";
import { uploadFile, MAX_PDF_BYTES } from "../../utils/upload";

// Lightweight preview so an admin can confirm the right (often unlisted) video
// loaded — without ever surfacing or copying the raw URL.
function VideoPreviewModal({ videoId, title, onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal vpreview-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="smx-modal-close" aria-label="Close" onClick={onClose}><X size={18} /></button>
        <h3 className="vpreview-title">{title || "Video preview"}</h3>
        <div className="vpreview-frame">
          <iframe
            src={getYouTubeEmbed(videoId, { autoplay: false })}
            title={title || "Video preview"}
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}

// A single saved video row with an inline, persisted title editor.
function VideoRow({ item, onPreview, onSaveTitle, onDelete }) {
  const [title, setTitle] = useState(item.title || "");
  const dirty = title.trim() !== (item.title || "").trim() && title.trim().length > 0;

  const save = () => { if (dirty) onSaveTitle(item.id, title.trim()); };

  return (
    <article className="vid-row">
      <button type="button" className="vid-thumb" onClick={() => onPreview({ videoId: item.url, title: item.title })} title="Preview video">
        <img src={getYouTubeThumbnail(item.url)} alt="" loading="lazy" decoding="async" />
        <i><Play size={14} /></i>
      </button>
      <input
        className="vid-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === "Enter") { e.currentTarget.blur(); } }}
        placeholder="Lesson title"
      />
      {dirty && <button type="button" className="vid-save" onClick={save}>Save</button>}
      <button type="button" className="vid-del" aria-label="Delete video" onClick={() => onDelete(item.id)}><Trash2 size={15} /></button>
    </article>
  );
}

/**
 * Lesson-video editor for a single topic — fully persisted to the youtubes table.
 * Admin pastes a URL and a title together; edits and deletes hit the backend and
 * reflect on the student side immediately.
 */
export function AdminVideos({ topic, onAddVideo, onUpdateVideo, onDeleteVideo }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);

  const detectedId = getYouTubeId(url);
  const urlDirty = url.trim().length > 0;
  const urlValid = detectedId.length === 11;
  const canAdd = urlValid && title.trim().length > 0 && !busy;
  const videos = topic.videos || [];

  const add = async () => {
    if (!canAdd) return;
    setBusy(true);
    const ok = await onAddVideo?.(topic.id, url.trim(), title.trim());
    setBusy(false);
    if (ok) { setUrl(""); setTitle(""); }
  };

  return (
    <div className="vid-editor">
      <div className="vid-add">
        <div className="vid-add-fields">
          <label className="vid-field">
            <span>YouTube link</span>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste an unlisted or public YouTube link…"
            />
          </label>
          <label className="vid-field">
            <span>Lesson title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && canAdd) add(); }}
              placeholder="e.g. Concept core — Biot–Savart law"
            />
          </label>
        </div>
        <Button variant="primary" onClick={add} disabled={!canAdd}>{busy ? "Saving…" : "Add video"}</Button>
      </div>

      {urlDirty && (
        urlValid ? (
          <div className="yt-detect ok">
            <img className="yt-detect-thumb" src={getYouTubeThumbnail(detectedId)} alt="" loading="lazy" decoding="async" />
            <div className="yt-detect-info">
              <strong><Check size={14} /> Video detected</strong>
              <small>{title.trim() ? "Ready to add." : "Add a lesson title to save it."} The link is stored privately — students only see the player.</small>
            </div>
            <button type="button" className="yt-detect-play" onClick={() => setPreview({ videoId: detectedId, title: title || "New video" })}>
              <Play size={14} /> Preview
            </button>
          </div>
        ) : (
          <div className="yt-detect err"><X size={14} /> That doesn’t look like a valid YouTube link.</div>
        )
      )}

      <div className="vid-list">
        {videos.length === 0 && <p className="editor-empty">No videos yet. Paste a link and title above to add the first lesson.</p>}
        {videos.map((item) => (
          <VideoRow
            key={item.id}
            item={item}
            onPreview={setPreview}
            onSaveTitle={(id, t) => onUpdateVideo?.(id, { title: t })}
            onDelete={(id) => onDeleteVideo?.(id)}
          />
        ))}
      </div>

      {preview && <VideoPreviewModal videoId={preview.videoId} title={preview.title} onClose={() => setPreview(null)} />}
    </div>
  );
}

export function UploadIllustration() {
  return (
    <span className="upload-illustration" aria-hidden="true">
      <Upload size={22} />
      <i />
      <i />
    </span>
  );
}

function prettyBytes(n) {
  if (!n && n !== 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * PDF notes manager for a single topic — fully persisted.
 * Flow per file: validate → upload to Supabase Storage (signed URL) → persist
 * the returned public URL via the notes endpoint (onAddNote). The course tree is
 * cache-invalidated on the backend, so students see new notes on their next load.
 * Surfaces its own animated idle → uploading → success/error states in addition
 * to the global toast — never shows a raw/developer error string.
 */
export function AdminNotes({ topic, onAddNote, onDeleteNote }) {
  const [dragging, setDragging] = useState(false);
  // Per-file upload queue: { name, size, status: 'uploading'|'success'|'error', message }
  const [queue, setQueue] = useState([]);
  const [busy, setBusy] = useState(false);
  const notes = topic.notes || [];

  const noteTitle = (file) => file.name.replace(/\.pdf$/i, "").slice(0, 300) || "Notes";

  const uploadOne = async (file, index) => {
    const patch = (fields) => setQueue((q) => q.map((row, i) => (i === index ? { ...row, ...fields } : row)));
    try {
      const url = await uploadFile(file, "note");
      const ok = await onAddNote?.(topic.id, noteTitle(file), url);
      if (ok) patch({ status: "success", message: "Published to students" });
      else patch({ status: "error", message: "Couldn’t save. Please try again." });
    } catch {
      // Friendly only — the underlying storage/network error is never surfaced.
      patch({ status: "error", message: "Upload failed. Check your connection and retry." });
    }
  };

  const handleFiles = async (files) => {
    const pdfs = files.filter((f) => f.type === "application/pdf" || /\.pdf$/i.test(f.name));
    const rejectedType = files.length - pdfs.length;
    const accepted = [];
    const rows = [];
    pdfs.forEach((f) => {
      if (f.size > MAX_PDF_BYTES) {
        rows.push({ name: f.name, size: f.size, status: "error", message: `Too large — max ${prettyBytes(MAX_PDF_BYTES)}` });
      } else {
        rows.push({ name: f.name, size: f.size, status: "uploading", message: "Uploading…" });
        accepted.push(f);
      }
    });
    if (rejectedType > 0) {
      rows.push({ name: `${rejectedType} file${rejectedType > 1 ? "s" : ""} skipped`, size: 0, status: "error", message: "PDF files only" });
    }
    if (!rows.length) return;

    const startAt = queue.length;
    setQueue((q) => [...q, ...rows]);
    setBusy(true);

    // Upload accepted files sequentially so slow connections stay ordered.
    let cursor = startAt;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].status !== "uploading") continue;
      const file = accepted.shift();
      // eslint-disable-next-line no-await-in-loop
      await uploadOne(file, cursor + i);
    }
    setBusy(false);
  };

  const onPick = (event) => {
    handleFiles(Array.from(event.target.files || []));
    event.target.value = "";
  };

  const clearQueue = () => setQueue((q) => q.filter((r) => r.status === "uploading"));

  return (
    <div className="notes-editor">
      <section>
        <div className="notes-editor-head">
          <h3>Upload PDF notes</h3>
          <span className="notes-editor-hint">Saved to database · appears instantly for students</span>
        </div>
        <label
          className={`upload-box notes-dropzone ${dragging ? "dragging" : ""} ${busy ? "busy" : ""}`}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            handleFiles(Array.from(event.dataTransfer.files || []));
          }}
        >
          <span className={`notes-drop-illus ${busy ? "pulsing" : ""}`} aria-hidden="true">
            {busy ? <Loader2 className="spin" size={26} /> : <CloudUpload size={26} />}
          </span>
          <span className="notes-drop-title">{busy ? "Uploading notes…" : "Drop a PDF here or choose a file"}</span>
          <small>PDF only · up to {prettyBytes(MAX_PDF_BYTES)} · multiple files supported</small>
          <input type="file" accept="application/pdf" multiple onChange={onPick} disabled={busy} />
        </label>

        {queue.length > 0 && (
          <div className="notes-queue">
            <div className="notes-queue-head">
              <span>Upload activity</span>
              <button type="button" className="notes-queue-clear" onClick={clearQueue} disabled={busy}>Clear finished</button>
            </div>
            {queue.map((row, i) => (
              <div key={`${row.name}-${i}`} className={`notes-queue-row ${row.status}`}>
                <span className="nq-icon">
                  {row.status === "uploading" && <Loader2 className="spin" size={15} />}
                  {row.status === "success" && <Check size={15} />}
                  {row.status === "error" && <AlertTriangle size={15} />}
                </span>
                <span className="nq-name">{row.name}{row.size ? <em> · {prettyBytes(row.size)}</em> : null}</span>
                <span className="nq-msg">{row.message}</span>
                {row.status === "uploading" && <span className="nq-bar" aria-hidden="true"><i /></span>}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="note-list">
        <h4 className="note-list-title">Published notes <span>{notes.length}</span></h4>
        {notes.length === 0 && <p className="editor-empty">No notes uploaded yet. Add a PDF above — students will see it under the chapter’s Notes tab.</p>}
        {notes.map((note) => (
          <article key={note.id} className="note-row">
            <span className="note-row-icon"><FileText size={16} /></span>
            <span className="note-row-title">{note.title}</span>
            {note.url && (
              <a className="note-row-open" href={note.url} target="_blank" rel="noreferrer" title="Open PDF in a new tab">
                <ExternalLink size={14} />
              </a>
            )}
            <Button className="icon-btn" aria-label="Delete note" onClick={() => onDeleteNote?.(note.id)}><Trash2 size={14} /></Button>
          </article>
        ))}
      </div>
    </div>
  );
}
