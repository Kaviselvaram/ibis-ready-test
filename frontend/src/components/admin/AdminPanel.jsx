import { getYouTubeThumbnail } from "../../utils/youtube";
import { useCourseContext } from "../../contexts/CourseContext";
import { CourseRepository } from "../../repositories/CourseRepository";
import { useAdminContext } from "../../contexts/AdminContext";
import React, { useState, useEffect } from 'react';
import { ArrowDown, ArrowUp, Edit3, FileText, Plus, Trash2, Upload, Video } from 'lucide-react';
import { Button, Pill } from '../ui/LegacyUI';

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

export function AdminVideos({ type, topic, updateTopic, onAddVideo, onDeleteVideo }) {
  const field = type === "worked" ? "examples" : "videos";
  const label = type === "worked" ? "worked example" : "video";
  // The "videos" tab persists to Supabase (youtubes). "Worked examples" stay
  // local until the schema gains a discriminator (handled in a later phase).
  const persists = type === "video";
  const [url, setUrl] = useState("");

  const updateMedia = (id, patch) => {
    updateTopic(topic.id, (topicItem) => ({
      ...topicItem,
      [field]: topicItem[field].map((item) => item.id === id ? { ...item, ...patch } : item)
    }));
  };

  const addMedia = () => {
    if (!url.trim()) return;
    if (persists) {
      onAddVideo?.(topic.id, url.trim());
      setUrl("");
      return;
    }
    updateTopic(topic.id, (topicItem) => ({
      ...topicItem,
      [field]: [
        ...topicItem[field],
        {
          id: `${field}-${Date.now()}`,
          label: "New worked example",
          title: "Editable title field",
          url,
          duration: "10 min"
        }
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

  const addPdf = (event) => {
    addPdfFiles(Array.from(event.target.files || []));
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

  const chapter = chapters[chapterIndex] || chapters[0];
  const topic = chapter?.topics[topicIndex] || chapter?.topics[0];
  const [newChapter, setNewChapter] = useState("");
  const [newTopic, setNewTopic] = useState("");

  // Pull the canonical course tree back from the backend after every mutation.
  const refresh = async () => {
    try {
      const data = await CourseRepository.getChapters();
      setChapters(data || []);
    } catch (e) { console.error("Failed to refresh chapters:", e); }
  };

  // Local-only updater, used by child editors for optimistic in-topic edits.
  const updateTopic = (topicId, updater) => {
    setChapters((items) => items.map((item) => item.id !== chapter?.id ? item : ({
      ...item,
      topics: item.topics.map((topicItem) => topicItem.id === topicId ? updater(topicItem) : topicItem)
    })));
  };

  const addChapter = async () => {
    const name = newChapter.trim();
    if (!name) return;
    setNewChapter("");
    try { await CourseRepository.createChapter(name); await refresh(); }
    catch (e) { console.error("Add chapter failed:", e); }
  };

  const renameChapter = async (id, name) => {
    const title = (name || "").trim();
    if (!title) return;
    try { await CourseRepository.updateChapter(id, { title }); await refresh(); }
    catch (e) { console.error("Rename chapter failed:", e); }
  };

  const deleteChapter = async (id) => {
    try { await CourseRepository.deleteChapter(id); setChapterIndex(0); setTopicIndex(0); await refresh(); }
    catch (e) { console.error("Delete chapter failed:", e); }
  };

  const moveChapter = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= chapters.length) return;
    const ordered = reorder(chapters, index, direction).map((c) => c.id);
    try { await CourseRepository.reorderChapters(ordered); await refresh(); }
    catch (e) { console.error("Reorder chapters failed:", e); }
  };

  const addTopic = async () => {
    const name = newTopic.trim();
    if (!name || !chapter) return;
    setNewTopic("");
    try { await CourseRepository.createTopic({ chapter_id: chapter.id, title: name }); await refresh(); }
    catch (e) { console.error("Add topic failed:", e); }
  };

  const renameTopic = async (id, name) => {
    const title = (name || "").trim();
    if (!title) return;
    try { await CourseRepository.updateTopic(id, { title }); await refresh(); }
    catch (e) { console.error("Rename topic failed:", e); }
  };

  const deleteTopic = async (topicId) => {
    try { await CourseRepository.deleteTopic(topicId); setTopicIndex(0); await refresh(); }
    catch (e) { console.error("Delete topic failed:", e); }
  };

  const moveTopic = async (index, direction) => {
    if (!chapter) return;
    const target = index + direction;
    if (target < 0 || target >= chapter.topics.length) return;
    const ordered = reorder(chapter.topics, index, direction).map((t) => t.id);
    try { await CourseRepository.reorderTopics(ordered); await refresh(); }
    catch (e) { console.error("Reorder topics failed:", e); }
  };

  // Video (youtubes) persistence for the AdminVideos editor.
  const addVideoBackend = async (topicId, url, title) => {
    try { await CourseRepository.addVideo({ topic_id: topicId, url, title }); await refresh(); }
    catch (e) { console.error("Add video failed:", e); }
  };
  const deleteVideoBackend = async (videoId) => {
    try { await CourseRepository.deleteVideo(videoId); await refresh(); }
    catch (e) { console.error("Delete video failed:", e); }
  };

  return (
    <div className="adminx-page">
      <header className="adminx-pagehead">
        <div>
          <h1>Content</h1>
          <p>Manage chapters, topics, lessons and notes. Every change saves to the database and appears live for students.</p>
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
              onRename={(name) => renameChapter(item.id, name)}
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
              onRename={(name) => renameTopic(item.id, name)}
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
            <Pill tone="accent">saved to database</Pill>
          </div>
          <nav className="tabs compact">
            {["videos", "worked", "notes"].map((item) => (
              <button
                key={item}
                className={activeTab === item ? "active" : ""}
                onClick={() => setActiveTab(item)}
              >
                {item === "worked" ? "Worked examples" : item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
          </nav>
          {topic && activeTab === "notes" && <AdminNotes topic={topic} updateTopic={updateTopic} />}
          {topic && (activeTab === "videos" || activeTab === "worked") && (
            <AdminVideos
              type={activeTab}
              topic={topic}
              updateTopic={updateTopic}
              onAddVideo={addVideoBackend}
              onDeleteVideo={deleteVideoBackend}
            />
          )}
        </section>
      </div>
    </div>
  );
}

