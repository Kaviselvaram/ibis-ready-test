import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Plus, ArrowUp, ArrowDown, Trash2, ChevronRight, ArrowLeft, Edit3, Unlock, Lock, Video, FileText } from "lucide-react";
import { useContentAdmin } from "../../hooks/useContentAdmin";
import { Button } from "../ui/LegacyUI";

export default function AdminContentChapter() {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const { chapters, addTopic, renameTopic, deleteTopic, moveTopic, setTopicFree } = useContentAdmin();
  const chapter = chapters.find((c) => c.id === chapterId);

  const [newTopic, setNewTopic] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");

  // Tree may still be loading on a hard refresh into this URL.
  if (!chapter) {
    return (
      <div className="adminx-page">
        <header className="adminx-pagehead"><div><h1>Chapter</h1><p>Loading…</p></div></header>
      </div>
    );
  }

  const topics = chapter.topics || [];
  const startEdit = (t) => { setEditingId(t.id); setDraft(t.name); };
  const commitEdit = (t) => { renameTopic(t.id, draft.trim() || t.name); setEditingId(null); };
  const onAdd = async () => { const n = newTopic.trim(); if (!n) return; setNewTopic(""); await addTopic(chapter.id, n); };

  return (
    <div className="adminx-page">
      <nav className="content-breadcrumb">
        <Link to="/admin/content"><ArrowLeft size={14} /> Content</Link>
        <ChevronRight size={13} />
        <span>{chapter.name}</span>
      </nav>

      <header className="adminx-pagehead">
        <div>
          <h1>{chapter.name}</h1>
          <p>Manage the topics in this chapter. Click a topic to edit its videos and notes.</p>
        </div>
        <div className="adminx-headstats">
          <div><strong>{topics.length}</strong><span>Topics</span></div>
        </div>
      </header>

      <div className="content-add">
        <input
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
          placeholder="New topic name…"
        />
        <Button variant="primary" onClick={onAdd}><Plus size={16} /> Add topic</Button>
      </div>

      {topics.length === 0 ? (
        <div className="content-empty">
          <FileText size={34} />
          <h2>No topics yet</h2>
          <p>Add your first topic above.</p>
        </div>
      ) : (
        <div className="topic-list">
          {topics.map((t, index) => (
            <article className="topic-row" key={t.id}>
              <button className="topic-row-main" onClick={() => navigate(`/admin/content/${chapter.id}/${t.id}`)}>
                <span className="topic-row-index">{index + 1}</span>
                <span className="topic-row-body">
                  {editingId === t.id ? (
                    <input
                      className="topic-row-rename"
                      value={draft}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setDraft(e.target.value)}
                      onBlur={() => commitEdit(t)}
                      onKeyDown={(e) => { if (e.key === "Enter") commitEdit(t); }}
                    />
                  ) : (
                    <strong>{t.name}</strong>
                  )}
                  <small>
                    <span><Video size={12} /> {t.videos?.length || 0}</span>
                    <span><FileText size={12} /> {t.notes?.length || 0}</span>
                  </small>
                </span>
                <ChevronRight size={18} className="topic-row-chevron" />
              </button>
              <div className="topic-row-actions">
                <button
                  className={`ctag ${t.isFree ? "free" : ""}`}
                  onClick={() => setTopicFree(t.id, !t.isFree)}
                  title={t.isFree ? "Free topic — click to lock" : "Locked topic — click to make free"}
                >
                  {t.isFree ? <Unlock size={13} /> : <Lock size={13} />} {t.isFree ? "Free" : "Locked"}
                </button>
                <button aria-label="Rename" onClick={() => startEdit(t)}><Edit3 size={14} /></button>
                <button aria-label="Move up" disabled={index === 0} onClick={() => moveTopic(topics, index, -1)}><ArrowUp size={14} /></button>
                <button aria-label="Move down" disabled={index === topics.length - 1} onClick={() => moveTopic(topics, index, 1)}><ArrowDown size={14} /></button>
                <button aria-label="Delete" className="danger" onClick={() => { if (confirm(`Delete topic "${t.name}"?`)) deleteTopic(t.id); }}><Trash2 size={14} /></button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
