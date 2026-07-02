import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowUp, ArrowDown, Trash2, ChevronRight, Layers, Eye, EyeOff, Lock, Unlock, Edit3, ImageUp, ImageOff, X } from "lucide-react";
import { useContentAdmin } from "../../hooks/useContentAdmin";
import { useToast, friendlyMessage } from "../../contexts/ToastContext";
import { uploadFile, MAX_IMAGE_BYTES } from "../../utils/upload";
import ChapterImage from "../shared/ChapterImage";
import { Button } from "../ui/LegacyUI";

export default function AdminContent() {
  const navigate = useNavigate();
  const toast = useToast();
  const {
    chapters, addChapter, renameChapter, deleteChapter, moveChapter,
    setChapterFree, setChapterPublished, setChapterImage
  } = useContentAdmin();
  const [newChapter, setNewChapter] = useState("");
  const [thumb, setThumb] = useState(null); // { file, preview }
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");

  // Shared hidden input for replacing a tile's thumbnail.
  const replaceRef = useRef(null);
  const pendingId = useRef(null);

  const pickThumb = (file) => {
    if (!file) return null;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file."); return null; }
    if (file.size > MAX_IMAGE_BYTES) { toast.error("Image is too large (max 5 MB)."); return null; }
    return file;
  };

  const onChooseCreateThumb = (e) => {
    const file = pickThumb(e.target.files?.[0]);
    if (file) setThumb({ file, preview: URL.createObjectURL(file) });
    e.target.value = "";
  };

  const onAdd = async () => {
    const n = newChapter.trim();
    if (!n || busy) return;
    setBusy(true);
    try {
      let imageUrl = null;
      if (thumb?.file) {
        imageUrl = await toast.promise(() => uploadFile(thumb.file, "thumbnail"),
          { loading: "Uploading thumbnail…", success: "Thumbnail uploaded", error: (e) => friendlyMessage(e, "Thumbnail upload failed.") });
      }
      const ok = await addChapter(n, imageUrl);
      if (ok) { setNewChapter(""); setThumb(null); }
    } catch { /* toast already shown */ }
    finally { setBusy(false); }
  };

  const onReplaceThumb = (chId) => { pendingId.current = chId; replaceRef.current?.click(); };
  const onChooseReplace = async (e) => {
    const file = pickThumb(e.target.files?.[0]);
    e.target.value = "";
    const chId = pendingId.current;
    if (!file || !chId) return;
    try {
      const url = await toast.promise(() => uploadFile(file, "thumbnail"),
        { loading: "Uploading thumbnail…", success: "Uploaded", error: (er) => friendlyMessage(er, "Upload failed.") });
      await setChapterImage(chId, url);
    } catch { /* handled */ }
  };

  const startEdit = (ch) => { setEditingId(ch.id); setDraft(ch.name); };
  const commitEdit = (ch) => { renameChapter(ch.id, draft.trim() || ch.name); setEditingId(null); };

  const topicCount = chapters.reduce((n, c) => n + (c.topics?.length || 0), 0);

  return (
    <div className="adminx-page">
      <input ref={replaceRef} type="file" accept="image/*" hidden onChange={onChooseReplace} />

      <header className="adminx-pagehead">
        <div>
          <h1>Content</h1>
          <p>Chapters, topics, lessons and notes. Every change saves to the database and appears live for students.</p>
        </div>
        <div className="adminx-headstats">
          <div><strong>{chapters.length}</strong><span>Chapters</span></div>
          <div><strong>{topicCount}</strong><span>Topics</span></div>
        </div>
      </header>

      <div className="content-add content-add-chapter">
        <label className="chapter-thumb-pick" title="Optional thumbnail">
          {thumb ? (
            <img src={thumb.preview} alt="" />
          ) : (
            <span><ImageUp size={18} /><small>Thumbnail</small></span>
          )}
          <input type="file" accept="image/*" hidden onChange={onChooseCreateThumb} />
        </label>
        {thumb && (
          <button type="button" className="chapter-thumb-clear" onClick={() => setThumb(null)} title="Remove chosen thumbnail"><X size={14} /></button>
        )}
        <input
          value={newChapter}
          onChange={(e) => setNewChapter(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
          placeholder="New chapter name…"
        />
        <Button variant="primary" onClick={onAdd} disabled={busy}><Plus size={16} /> {busy ? "Adding…" : "Add chapter"}</Button>
      </div>

      {chapters.length === 0 ? (
        <div className="content-empty">
          <Layers size={34} />
          <h2>No chapters yet</h2>
          <p>Add your first chapter above to start building the course.</p>
        </div>
      ) : (
        <div className="content-grid">
          {chapters.map((ch, index) => (
            <article className="chapter-tile" key={ch.id}>
              <button className="chapter-tile-open" onClick={() => navigate(`/admin/content/${ch.id}`)} aria-label={`Open ${ch.name}`}>
                <span className="chapter-tile-media"><ChapterImage chapter={ch} /></span>
                <span className="chapter-tile-body">
                  {editingId === ch.id ? (
                    <input
                      className="chapter-tile-rename"
                      value={draft}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setDraft(e.target.value)}
                      onBlur={() => commitEdit(ch)}
                      onKeyDown={(e) => { if (e.key === "Enter") commitEdit(ch); }}
                    />
                  ) : (
                    <strong>{ch.name}</strong>
                  )}
                  <small>{ch.topics?.length || 0} topic{(ch.topics?.length || 0) === 1 ? "" : "s"}</small>
                </span>
                <ChevronRight size={18} className="chapter-tile-chevron" />
              </button>

              <div className="chapter-tile-tags">
                <button
                  className={`ctag ${ch.isFree ? "free" : ""}`}
                  onClick={() => setChapterFree(ch.id, !ch.isFree)}
                  title={ch.isFree ? "Free chapter — click to make premium" : "Premium chapter — click to make free"}
                >
                  {ch.isFree ? <Unlock size={13} /> : <Lock size={13} />} {ch.isFree ? "Free" : "Premium"}
                </button>
                <button
                  className={`ctag ${ch.isPublished ? "pub" : "draft"}`}
                  onClick={() => setChapterPublished(ch.id, !ch.isPublished)}
                  title={ch.isPublished ? "Published — click to unpublish" : "Draft — click to publish"}
                >
                  {ch.isPublished ? <Eye size={13} /> : <EyeOff size={13} />} {ch.isPublished ? "Published" : "Draft"}
                </button>
              </div>

              <div className="chapter-tile-actions">
                <button aria-label="Rename" title="Rename" onClick={() => startEdit(ch)}><Edit3 size={14} /></button>
                <button aria-label="Change thumbnail" title="Change thumbnail" onClick={() => onReplaceThumb(ch.id)}><ImageUp size={14} /></button>
                {ch.imageUrl && (
                  <button aria-label="Remove thumbnail" title="Remove thumbnail" onClick={() => setChapterImage(ch.id, null)}><ImageOff size={14} /></button>
                )}
                <button aria-label="Move up" title="Move up" disabled={index === 0} onClick={() => moveChapter(chapters, index, -1)}><ArrowUp size={14} /></button>
                <button aria-label="Move down" title="Move down" disabled={index === chapters.length - 1} onClick={() => moveChapter(chapters, index, 1)}><ArrowDown size={14} /></button>
                <button aria-label="Delete" title="Delete" className="danger" onClick={() => { if (confirm(`Delete "${ch.name}" and all its topics?`)) deleteChapter(ch.id); }}><Trash2 size={14} /></button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
