import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, ArrowLeft, Video, FileText, PlayCircle, Unlock, Lock } from "lucide-react";
import { useContentAdmin } from "../../hooks/useContentAdmin";
import { AdminVideos, AdminNotes } from "./ContentEditors";

const TABS = [
  { key: "videos", label: "Videos", icon: Video },
  { key: "worked", label: "Worked examples", icon: PlayCircle },
  { key: "notes", label: "Notes", icon: FileText }
];

export default function AdminContentTopic() {
  const { chapterId, topicId } = useParams();
  const { chapters, updateTopic, addVideo, deleteVideo, setTopicFree } = useContentAdmin();
  const [tab, setTab] = useState("videos");

  const chapter = chapters.find((c) => c.id === chapterId);
  const topic = chapter?.topics.find((t) => t.id === topicId);

  if (!chapter || !topic) {
    return (
      <div className="adminx-page">
        <header className="adminx-pagehead"><div><h1>Topic</h1><p>Loading…</p></div></header>
      </div>
    );
  }

  // Bind the chapter into the editors' (topicId, updater) signature.
  const boundUpdateTopic = (tId, updater) => updateTopic(chapter.id, tId, updater);

  return (
    <div className="adminx-page">
      <nav className="content-breadcrumb">
        <Link to="/admin/content"><ArrowLeft size={14} /> Content</Link>
        <ChevronRight size={13} />
        <Link to={`/admin/content/${chapter.id}`}>{chapter.name}</Link>
        <ChevronRight size={13} />
        <span>{topic.name}</span>
      </nav>

      <header className="adminx-pagehead">
        <div>
          <h1>{topic.name}</h1>
          <p>Add lesson videos, worked examples and notes. Video changes save to the database instantly.</p>
        </div>
        <button
          className={`ctag lg ${topic.isFree ? "free" : ""}`}
          onClick={() => setTopicFree(topic.id, !topic.isFree)}
          title={topic.isFree ? "Free topic — click to lock" : "Locked topic — click to make free"}
        >
          {topic.isFree ? <Unlock size={14} /> : <Lock size={14} />} {topic.isFree ? "Free trial topic" : "Locked topic"}
        </button>
      </header>

      <div className="topic-editor">
        <nav className="topic-editor-tabs">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
              <Icon size={16} /> {label}
            </button>
          ))}
          <span className="topic-editor-savedpill">saved to database</span>
        </nav>

        <div className="topic-editor-panel">
          {tab === "notes" ? (
            <AdminNotes topic={topic} updateTopic={boundUpdateTopic} />
          ) : (
            <AdminVideos
              type={tab}
              topic={topic}
              updateTopic={boundUpdateTopic}
              onAddVideo={addVideo}
              onDeleteVideo={deleteVideo}
            />
          )}
        </div>
      </div>
    </div>
  );
}
