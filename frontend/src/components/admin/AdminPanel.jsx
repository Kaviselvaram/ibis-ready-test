import { getYouTubeThumbnail } from "../../utils/youtube";
import { useCourseContext } from "../../contexts/CourseContext";
import { CourseRepository } from "../../repositories/CourseRepository";
import { useAdminContext } from "../../contexts/AdminContext";
import { useAdminController } from "../../hooks/useAdminController";
import { useNavigationController } from "../../hooks/useNavigationController";
import { useAuthenticationController } from "../../hooks/useAuthenticationController";
import React, { useState, useEffect } from 'react';
import { ArrowDown, ArrowUp, CalendarDays, Clipboard, Edit3, Eye, EyeOff, FileText, Lock, LogOut, Play, Plus, Save, Trash2, Upload, Users, Video } from 'lucide-react';
import { Brand, Button, GlassButton, Pill, ShinyButton } from '../ui/LegacyUI';

import { AdminQuestionBank } from "../test/AdminQuestionBank";
import LatexDocument from "../LatexDocument";

const LatexFallback = () => <div style={{ padding: "20px", color: "var(--muted)" }}>Loading preview...</div>;

export function reorder(items, index, direction) {
  const next = [...items];
  const target = index + direction;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function AdminColumn({ title, badge, children }) {
  return (
    <section className="admin-column">
      <div className="admin-column-head">
        <h2>{title}</h2>
        {badge && <small>{badge}</small>}
      </div>
      {children}
    </section>
  );
}

export function AdminRow({ title, subtitle, image, active, onSelect, onRename, onUp, onDown, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  useEffect(() => setDraft(title), [title]);

  return (
    <article className={`admin-row ${active ? "active" : ""}`} title={title}>
      {image && <img src={image} alt="" loading="lazy" decoding="async" />}
      <button className="row-main" onClick={onSelect}>
        {editing ? (
          <input
            value={draft}
            autoFocus
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => { onRename(draft.trim() || title); setEditing(false); }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onRename(draft.trim() || title);
                setEditing(false);
              }
            }}
          />
        ) : (
          <>
            <strong>{title}</strong>
            <small>{subtitle}</small>
          </>
        )}
      </button>
      <div className="row-actions">
        <button aria-label="Move up" onClick={onUp}><ArrowUp size={14} /></button>
        <button aria-label="Move down" onClick={onDown}><ArrowDown size={14} /></button>
        <button aria-label="Edit" onClick={() => setEditing(true)}><Edit3 size={14} /></button>
        <button aria-label="Delete" onClick={onDelete}><Trash2 size={14} /></button>
      </div>
    </article>
  );
}

export function AdminVideos({ type, topic, updateTopic }) {
  const field = type === "worked" ? "examples" : "videos";
  const label = type === "worked" ? "worked example" : "video";
  const [url, setUrl] = useState("");

  const updateMedia = (id, patch) => {
    updateTopic(topic.id, (topicItem) => ({
      ...topicItem,
      [field]: topicItem[field].map((item) => item.id === id ? { ...item, ...patch } : item)
    }));
  };

  const addMedia = () => {
    if (!url.trim()) return;
    updateTopic(topic.id, (topicItem) => ({
      ...topicItem,
      [field]: [
        ...topicItem[field],
        {
          id: `${field}-${Date.now()}`,
          label: label === "video" ? "New lesson" : "New worked example",
          title: "Editable title field",
          url,
          duration: "10 min"
        }
      ]
    }));
    setUrl("");
  };

  const removeMedia = (id) => {
    updateTopic(topic.id, (topicItem) => ({ ...topicItem, [field]: topicItem[field].filter((item) => item.id !== id) }));
  };

  const moveMedia = (index, direction) => {
    updateTopic(topic.id, (topicItem) => ({ ...topicItem, [field]: reorder(topicItem[field], index, direction) }));
  };

  return (
    <div className="editor-body">
      <div className="input-row">
        <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder={`Paste YouTube link for a ${label}...`} />
        <Button variant="primary" onClick={addMedia}>Add</Button>
      </div>
      {topic[field].map((item, index) => (
        <article className="editable-card" key={item.id}>
          <span className="thumb">
            <img src={getYouTubeThumbnail(item.url)} alt="" />
            <i><Video size={14} /></i>
          </span>
          <input value={item.label} onChange={(event) => updateMedia(item.id, { label: event.target.value })} />
          <input value={item.title} onChange={(event) => updateMedia(item.id, { title: event.target.value })} />
          <button aria-label="Move up" onClick={() => moveMedia(index, -1)}><ArrowUp size={14} /></button>
          <button aria-label="Move down" onClick={() => moveMedia(index, 1)}><ArrowDown size={14} /></button>
          <button aria-label="Delete" onClick={() => removeMedia(item.id)}><Trash2 size={14} /></button>
        </article>
      ))}
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
  const [latex, setLatex] = useState(topic.notes[0]?.content || "\\[ F = qE \\]");
  const [dragging, setDragging] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("PDF only · multiple files supported");
  const publishedLatex = topic.notes.find((note) => note.type === "latex");

  useEffect(() => {
    setLatex(publishedLatex?.content || "\\section*{New Notes}\\nType your LaTeX here.\\n\\[ F = qE \\]");
  }, [topic.id]);

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

  const addPdf = (event) => {
    addPdfFiles(Array.from(event.target.files || []));
  };

  const publishLatex = () => {
    updateTopic(topic.id, (topicItem) => ({
      ...topicItem,
      notes: [
        { id: `latex-${Date.now()}`, title: `${topicItem.name} LaTeX notes`, type: "latex", content: latex },
        ...topicItem.notes.filter((note) => note.type !== "latex")
      ]
    }));
  };

  const deleteNote = (noteId) => {
    updateTopic(topic.id, (topicItem) => ({ ...topicItem, notes: topicItem.notes.filter((note) => note.id !== noteId) }));
  };

  return (
    <div className="notes-editor">
      <section>
        <h3>Option A · Upload PDF</h3>
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
      <section>
        <h3>Option B · Paste LaTeX</h3>
        <textarea value={latex} onChange={(event) => setLatex(event.target.value)} />
        <Button variant="primary" onClick={publishLatex}><Save size={16} /> Publish to students</Button>
      </section>
      <article className="latex-preview">
        <strong>Live preview</strong>
        <React.Suspense fallback={<LatexFallback compact />}>
          <LatexDocument title={`${topic.name} preview`} source={latex} compact />
        </React.Suspense>
      </article>
      <div className="note-list">
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

export default function AdminPanel() {
  const { chapters, setChapters, chapterIndex, setChapterIndex, topicIndex, setTopicIndex } = useCourseContext();
  
  useEffect(() => {
    if (chapters.length === 0) {
      CourseRepository.getChapters().then(setChapters).catch(console.error);
    }
  }, [chapters.length, setChapters]);
  const { adminTab: activeTab, setAdminTab: setActiveTab } = useAdminContext();
  const { questionBank, updateQuestionBank: setQuestionBank } = useAdminController();
  const { goToBatches } = useNavigationController();
  const { signOut } = useAuthenticationController();
  
  const onBatch = goToBatches;
  const onLogout = signOut;

  const chapter = chapters[chapterIndex] || chapters[0];
  const topic = chapter?.topics[topicIndex] || chapter?.topics[0];
  const [newChapter, setNewChapter] = useState("");
  const [newTopic, setNewTopic] = useState("");

  const updateChapter = (chapterId, updater) => {
    setChapters((items) => items.map((item) => item.id === chapterId ? updater(item) : item));
  };

  const addChapter = () => {
    const name = newChapter.trim();
    if (!name) return;
    const image = chapters.length > 0 ? chapters[chapters.length % chapters.length].image : "";
    setChapters((items) => [...items, { id: Date.now(), name, image, progress: 0, topics: [] }]);
    setNewChapter("");
  };

  const deleteChapter = (id) => {
    setChapters((items) => items.filter((item) => item.id !== id));
    setChapterIndex(0);
    setTopicIndex(0);
  };

  const moveChapter = (index, direction) => {
    setChapters((items) => reorder(items, index, direction));
    setChapterIndex((value) => Math.max(0, Math.min(chapters.length - 1, value + direction)));
  };

  const addTopic = () => {
    const name = newTopic.trim();
    if (!name) return;
    updateChapter(chapter.id, (item) => ({
      ...item,
      topics: [...item.topics, { id: "topic-" + Date.now(), name, isFree: false, videos: [], examples: [], notes: [] }]
    }));
    setNewTopic("");
  };

  const updateTopic = (topicId, updater) => {
    updateChapter(chapter.id, (item) => ({
      ...item,
      topics: item.topics.map((topicItem) => topicItem.id === topicId ? updater(topicItem) : topicItem)
    }));
  };

  const deleteTopic = (topicId) => {
    updateChapter(chapter.id, (item) => ({
      ...item,
      topics: item.topics.filter((topicItem) => topicItem.id !== topicId)
    }));
    setTopicIndex(0);
  };

  const moveTopic = (index, direction) => {
    updateChapter(chapter.id, (item) => ({ ...item, topics: reorder(item.topics, index, direction) }));
    setTopicIndex(Math.max(0, Math.min(chapter.topics.length - 1, topicIndex + direction)));
  };

  return (
    <section className="admin-shell">
      <header className="topbar admin-bar">
        <Brand admin />
        <div className="top-actions">
          <Button variant="primary" onClick={onBatch}><Users size={16} /> Full control</Button>
          <Button onClick={onLogout}><LogOut size={16} /> Log out</Button>
        </div>
      </header>

      <div className="admin-grid">
        <AdminColumn title="Chapters" badge={`${chapters.length} total`}>
          {chapters.map((item, index) => (
            <AdminRow
              key={item.id}
              active={index === chapterIndex}
              image={item.image}
              title={item.name}
              subtitle={`${item.topics.length} topics`}
              onSelect={() => { setChapterIndex(index); setTopicIndex(0); }}
              onRename={(name) => updateChapter(item.id, (chapterItem) => ({ ...chapterItem, name }))}
              onUp={() => moveChapter(index, -1)}
              onDown={() => moveChapter(index, 1)}
              onDelete={() => deleteChapter(item.id)}
            />
          ))}
          <div className="inline-add">
            <input value={newChapter} onChange={(event) => setNewChapter(event.target.value)} placeholder="New chapter name" />
            <Button variant="ghost" onClick={addChapter}><Plus size={16} /> Add chapter</Button>
          </div>
        </AdminColumn>

        <AdminColumn title="Topics" badge={chapter?.name}>
          {chapter?.topics.map((item, index) => (
            <AdminRow
              key={item.id}
              active={index === topicIndex}
              title={item.name}
              subtitle={item.isFree ? "free trial topic" : "student-visible"}
              onSelect={() => setTopicIndex(index)}
              onRename={(name) => updateTopic(item.id, (topicItem) => ({ ...topicItem, name }))}
              onUp={() => moveTopic(index, -1)}
              onDown={() => moveTopic(index, 1)}
              onDelete={() => deleteTopic(item.id)}
            />
          ))}
          <div className="inline-add">
            <input value={newTopic} onChange={(event) => setNewTopic(event.target.value)} placeholder="New topic name" />
            <Button variant="ghost" onClick={addTopic}><Plus size={16} /> Add topic</Button>
          </div>
        </AdminColumn>

        <section className="editor-panel">
          <div className="editor-heading">
            <span>
              <small>Topic editor</small>
              <strong>{topic?.name || "Select a topic"}</strong>
            </span>
            <Pill tone="accent">live local changes</Pill>
          </div>
          <nav className="tabs compact">
            {["videos", "worked", "notes", "test"].map((item) => (
              <button
                key={item}
                className={activeTab === item ? "active" : ""}
                onClick={() => setActiveTab(item)}
              >
                {item === "worked" ? "Worked examples" : item === "test" ? "Test bank" : item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
          </nav>
          {topic && activeTab === "notes" && <AdminNotes topic={topic} updateTopic={updateTopic} />}
          {topic && (activeTab === "videos" || activeTab === "worked") && <AdminVideos type={activeTab} topic={topic} updateTopic={updateTopic} />}
          {activeTab === "test" && <AdminQuestionBank questionBank={questionBank} setQuestionBank={setQuestionBank} />}
        </section>
      </div>
    </section>
  );
}

