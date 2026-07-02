import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowUp, ArrowDown, Trash2, ChevronRight, Layers, Eye, EyeOff, Lock, Unlock, Edit3 } from "lucide-react";
import { useContentAdmin } from "../../hooks/useContentAdmin";
import ChapterImage from "../shared/ChapterImage";
import { Button } from "../ui/LegacyUI";

export default function AdminContent() {
  const navigate = useNavigate();
  const {
    chapters, addChapter, renameChapter, deleteChapter, moveChapter,
    setChapterFree, setChapterPublished
  } = useContentAdmin();
  const [newChapter, setNewChapter] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");

  const startEdit = (ch) => { setEditingId(ch.id); setDraft(ch.name); };
  const commitEdit = (ch) => { renameChapter(ch.id, draft.trim() || ch.name); setEditingId(null); };

  const onAdd = async () => { const n = newChapter.trim(); if (!n) return; setNewChapter(""); await addChapter(n); };

  const topicCount = chapters.reduce((n, c) => n + (c.topics?.length || 0), 0);

  return (
    <div className="adminx-page">
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

      <div className="content-add">
        <input
          value={newChapter}
          onChange={(e) => setNewChapter(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
          placeholder="New chapter name…"
        />
        <Button variant="primary" onClick={onAdd}><Plus size={16} /> Add chapter</Button>
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
                <button aria-label="Rename" onClick={() => startEdit(ch)}><Edit3 size={14} /></button>
                <button aria-label="Move up" disabled={index === 0} onClick={() => moveChapter(chapters, index, -1)}><ArrowUp size={14} /></button>
                <button aria-label="Move down" disabled={index === chapters.length - 1} onClick={() => moveChapter(chapters, index, 1)}><ArrowDown size={14} /></button>
                <button aria-label="Delete" className="danger" onClick={() => { if (confirm(`Delete "${ch.name}" and all its topics?`)) deleteChapter(ch.id); }}><Trash2 size={14} /></button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
