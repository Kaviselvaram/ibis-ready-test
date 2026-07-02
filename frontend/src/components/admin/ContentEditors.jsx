import React, { useState } from "react";
import { FileText, Trash2, Upload, Play, Check, X } from "lucide-react";
import { getYouTubeThumbnail, getYouTubeId, getYouTubeEmbed } from "../../utils/youtube";
import { Button } from "../ui/LegacyUI";

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
        <img src={getYouTubeThumbnail(item.url)} alt="" />
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
            <img className="yt-detect-thumb" src={getYouTubeThumbnail(detectedId)} alt="" />
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

export function AdminNotes({ topic, updateTopic }) {
  const [dragging, setDragging] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("PDF only · multiple files supported");

  const addPdfFiles = (files) => {
    if (!files.length) return;
    setUploadMessage(`${files.length} file${files.length > 1 ? "s" : ""} added locally`);
    updateTopic(topic.id, (topicItem) => ({
      ...topicItem,
      notes: [
        ...topicItem.notes,
        ...files.map((file) => ({ id: `pdf-${Date.now()}-${file.name}`, title: file.name, type: "pdf", content: "Uploaded PDF preview" }))
      ]
    }));
  };

  const addPdf = (event) => addPdfFiles(Array.from(event.target.files || []));

  const deleteNote = (noteId) => {
    updateTopic(topic.id, (topicItem) => ({ ...topicItem, notes: topicItem.notes.filter((note) => note.id !== noteId) }));
  };

  return (
    <div className="notes-editor">
      <section>
        <h3>Upload PDF notes</h3>
        <label
          className={`upload-box ${dragging ? "dragging" : ""}`}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            addPdfFiles(Array.from(event.dataTransfer.files || []).filter((file) => file.type === "application/pdf"));
          }}
        >
          <UploadIllustration />
          <span>Drop notes PDFs or choose files</span>
          <small>{uploadMessage}</small>
          <input type="file" accept="application/pdf" multiple onChange={addPdf} />
        </label>
      </section>
      <div className="note-list">
        {topic.notes.length === 0 && <p className="editor-empty">No notes uploaded yet.</p>}
        {topic.notes.map((note) => (
          <article key={note.id}>
            <FileText size={16} />
            <span>{note.title}</span>
            <Button className="icon-btn" aria-label="Delete note" onClick={() => deleteNote(note.id)}><Trash2 size={14} /></Button>
          </article>
        ))}
      </div>
    </div>
  );
}
