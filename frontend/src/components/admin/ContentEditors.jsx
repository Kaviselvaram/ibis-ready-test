import React, { useState } from "react";
import { ArrowDown, ArrowUp, FileText, Trash2, Upload, Video, Play, Check, X } from "lucide-react";
import { getYouTubeThumbnail, getYouTubeId, getYouTubeEmbed } from "../../utils/youtube";
import { reorder } from "../../hooks/useContentAdmin";
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

/**
 * Video / worked-example editor for a single topic.
 * `updateTopic(topicId, updater)` performs an optimistic local edit; videos
 * additionally persist to the youtubes table via onAddVideo/onDeleteVideo.
 */
export function AdminVideos({ type, topic, updateTopic, onAddVideo, onDeleteVideo }) {
  const field = type === "worked" ? "examples" : "videos";
  const label = type === "worked" ? "worked example" : "video";
  // The "videos" tab persists to Supabase (youtubes). "Worked examples" stay
  // local until the schema gains a discriminator (handled in a later phase).
  const persists = type === "video";
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState(null); // { videoId, title } for the play modal

  // Auto-process the pasted link: a valid YouTube URL resolves to an 11-char id.
  const detectedId = getYouTubeId(url);
  const urlDirty = url.trim().length > 0;
  const urlValid = detectedId.length === 11;

  const updateMedia = (id, patch) => {
    updateTopic(topic.id, (topicItem) => ({
      ...topicItem,
      [field]: topicItem[field].map((item) => item.id === id ? { ...item, ...patch } : item)
    }));
  };

  const addMedia = () => {
    if (!urlValid) return;
    if (persists) {
      onAddVideo?.(topic.id, url.trim());
      setUrl("");
      return;
    }
    updateTopic(topic.id, (topicItem) => ({
      ...topicItem,
      [field]: [
        ...topicItem[field],
        { id: `${field}-${Date.now()}`, label: "New worked example", title: "Editable title field", url, duration: "10 min" }
      ]
    }));
    setUrl("");
  };

  const removeMedia = (id) => {
    if (persists) { onDeleteVideo?.(id); return; }
    updateTopic(topic.id, (topicItem) => ({ ...topicItem, [field]: topicItem[field].filter((item) => item.id !== id) }));
  };

  const moveMedia = (index, direction) => {
    updateTopic(topic.id, (topicItem) => ({ ...topicItem, [field]: reorder(topicItem[field], index, direction) }));
  };

  return (
    <div className="editor-body">
      <div className="input-row">
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && urlValid) addMedia(); }}
          placeholder={`Paste YouTube link for a ${label}...`}
        />
        <Button variant="primary" onClick={addMedia} disabled={!urlValid}>Add</Button>
      </div>

      {/* Auto-process feedback: parsed thumbnail + confirmation, or an error. */}
      {urlDirty && (
        urlValid ? (
          <div className="yt-detect ok">
            <img className="yt-detect-thumb" src={getYouTubeThumbnail(detectedId)} alt="" />
            <div className="yt-detect-info">
              <strong><Check size={14} /> Video detected</strong>
              <small>Ready to add. The link is stored privately — students only ever see the player.</small>
            </div>
            <button type="button" className="yt-detect-play" onClick={() => setPreview({ videoId: detectedId, title: "New video" })}>
              <Play size={14} /> Preview
            </button>
          </div>
        ) : (
          <div className="yt-detect err"><X size={14} /> That doesn't look like a valid YouTube link.</div>
        )
      )}

      {topic[field].length === 0 && <p className="editor-empty">No {label}s yet. Paste a YouTube link above to add one.</p>}
      {topic[field].map((item, index) => (
        <article className="editable-card" key={item.id}>
          <button type="button" className="thumb thumb-btn" onClick={() => setPreview({ videoId: item.url, title: item.title || item.label })} title="Preview video">
            <img src={getYouTubeThumbnail(item.url)} alt="" />
            <i><Play size={14} /></i>
          </button>
          <input value={item.label} onChange={(event) => updateMedia(item.id, { label: event.target.value })} />
          <input value={item.title} onChange={(event) => updateMedia(item.id, { title: event.target.value })} />
          <button aria-label="Move up" onClick={() => moveMedia(index, -1)}><ArrowUp size={14} /></button>
          <button aria-label="Move down" onClick={() => moveMedia(index, 1)}><ArrowDown size={14} /></button>
          <button aria-label="Delete" onClick={() => removeMedia(item.id)}><Trash2 size={14} /></button>
        </article>
      ))}

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
