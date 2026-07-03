import { getYouTubeThumbnail, getYouTubeEmbed } from "../../utils/youtube";
import { useCourseContext } from "../../contexts/CourseContext";
import { useAccessContext } from "../../contexts/AccessContext";
import { useAccessController } from "../../hooks/useAccessController";
import { useNavigationController } from "../../hooks/useNavigationController";
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Award, BookOpen, Download, FileText, Lock, Play, Video, WandSparkles, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Button, GlassButton, Pill } from '../ui/LegacyUI';
import { StudentTest } from "../test/StudentTest";
import ChapterImage from '../shared/ChapterImage';
import { AnimatePresence, motion } from "framer-motion";
import { logActivity } from "../../repositories/AnalyticsRepository";

const PdfReader = React.lazy(() => import("./PdfReader"));

export function ContentTab({ topic, chapterId }) {
  return (
    <>
      <div className="section-title">
        <h2>{topic.name}</h2>
        <Pill>{topic.videos.length} videos</Pill>
      </div>
      <div className="stack">
        {topic.videos.map((video) => <VideoCard key={video.id} video={video} chapterId={chapterId} topicId={topic.id} />)}
      </div>
      {topic.examples.length > 0 && (
        <>
          <div className="section-title divided">
            <h2>Worked Examples</h2>
            <Pill>{topic.examples.length} added</Pill>
          </div>
          <div className="stack">
            {topic.examples.map((video) => <VideoCard key={video.id} video={video} chapterId={chapterId} topicId={topic.id} faint />)}
          </div>
        </>
      )}
    </>
  );
}

export function VideoCard({ video, faint = false, chapterId, topicId }) {
  const [open, setOpen] = useState(false);

  const openVideo = () => {
    setOpen(true);
    logActivity("video_watch", { chapter_id: chapterId || null, topic_id: topicId || null });
  };

  return (
    <>
      <motion.button
        initial={{ scale: 1 }}
        whileTap={{ scale: 0.98 }}
        className={`video-card ${faint ? "faint" : ""} group`}
        onClick={openVideo}
        style={{ cursor: "pointer" }}
      >
        <span className="play-thumb">
          <img src={getYouTubeThumbnail(video.url)} alt="" className="transition-transform duration-300 group-hover:scale-105" />
          <i><Play size={14} className="fill-current" style={{ marginLeft: "1.5px" }} /></i>
        </span>
        <span>
          <strong>{video.label}</strong>
          <small>{video.title}</small>
        </span>
        <em>{video.duration}</em>
      </motion.button>
      
      <AnimatePresence>
        {open && <VideoModal video={video} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

export function VideoModal({ video, onClose }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <motion.div 
      className="overlay video-overlay" 
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.section
        className="video-modal"
        onClick={(event) => event.stopPropagation()}
        onContextMenu={(event) => event.preventDefault()}
        initial={{ scale: 0.82, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.82, opacity: 0 }}
        transition={{ type: "spring", duration: 0.45, bounce: 0.08 }}
      >
        <Button className="icon-btn close-btn" aria-label="Close video" onClick={onClose}><X size={16} /></Button>
        <div className="video-frame">
          <iframe
            src={getYouTubeEmbed(video.url)}
            title={video.title}
            allow="autoplay; encrypted-media; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
          {/* Transparent strip over the player's title bar so the embedded
              YouTube title can't be clicked through to youtube.com. */}
          <span className="video-frame-guard" aria-hidden="true" />
        </div>
        <div>
          <strong>{video.label}</strong>
          <span>{video.title}</span>
        </div>
      </motion.section>
    </motion.div>
  );
}

export function NotesTab({ topic, chapterId }) {
  const notes = (topic.notes || []).filter((n) => n.url); // only real, persisted PDFs
  const [activeId, setActiveId] = useState(null);

  const active = notes.find((n) => n.id === activeId) || notes[0];

  // Log a real content-view event when a set of notes is opened.
  useEffect(() => {
    if (active?.id) logActivity("note_view", { chapter_id: chapterId || null, topic_id: topic.id || null });
  }, [active?.id, chapterId, topic.id]);

  if (notes.length === 0) {
    return (
      <div className="empty-state">
        <FileText size={36} />
        <h2>Notes coming soon</h2>
        <p>The mentor has not attached notes for this topic yet.</p>
      </div>
    );
  }

  return (
    <div className="notes-tab">
      {notes.length > 1 && (
        <div className="notes-tab-switcher" role="tablist" aria-label="Notes documents">
          {notes.map((n) => (
            <button
              key={n.id}
              role="tab"
              aria-selected={n.id === active.id}
              className={n.id === active.id ? "active" : ""}
              onClick={() => setActiveId(n.id)}
            >
              <FileText size={13} /> {n.title}
            </button>
          ))}
        </div>
      )}
      <React.Suspense fallback={<div className="pdf-reader-loading"><FileText size={26} /><span>Preparing reader…</span></div>}>
        <PdfReader key={active.id} url={active.url} title={active.title} />
      </React.Suspense>
    </div>
  );
}

export function TestTab() {
  return (
    <div className="empty-state">
      <Award size={36} />
      <h2>Not enough content covered yet</h2>
      <p>Check back soon. Test management is planned for a future update.</p>
    </div>
  );
}

export default function ChapterView() {
  const { activeChapter: chapter, topicIndex, setTopicIndex, tab, setTab } = useCourseContext();
  const { access } = useAccessContext();
  const { goToStudentPortal, goToCheckout } = useNavigationController();

  // Chapter-level access: you can view the whole chapter only if you have full
  // access or this is the free chapter. Otherwise it's premium → pricing.
  const hasAccess = access === "full" || chapter?.isFree === true;

  useEffect(() => {
    if (!chapter) { goToStudentPortal(); return; }
    if (!hasAccess) goToCheckout();
  }, [chapter, hasAccess]);

  if (!chapter || !hasAccess) return null;

  const topics = chapter.topics || [];
  const topic = topics[topicIndex] || topics[0];

  return (
    <section className="learning-shell">
      <header className="chapter-top">
        <GlassButton type="button" size="icon" onClick={goToStudentPortal}><ArrowLeft size={18} /></GlassButton>
        <ChapterImage chapter={chapter} className="tiny-cover" />
        <strong>{chapter.name}</strong>
        <Pill tone="accent">{access === "full" ? "full access" : "free chapter"}</Pill>
      </header>
      <nav className="tabs" aria-label="Chapter tabs">
        {["content", "notes", "test"].map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </nav>

      <div className="chapter-layout">
        <aside className="topic-list">
          <h3>Topics</h3>
          {topics.map((item, idx) => (
            <button
              key={item.id}
              className={item.id === topic?.id ? "active" : ""}
              onClick={() => setTopicIndex(idx)}
            >
              <span>{item.name}</span>
              <small>{item.videos.length} videos · {item.notes.length} notes</small>
            </button>
          ))}
        </aside>
        <section className="topic-content">
          {tab === "content" && topic && <ContentTab topic={topic} chapterId={chapter.id} />}
          {tab === "notes" && topic && <NotesTab topic={topic} chapterId={chapter.id} />}
          {tab === "test" && <StudentTest chapter={chapter} />}
        </section>
      </div>
    </section>
  );
}

