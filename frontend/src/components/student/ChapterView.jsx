import { getYouTubeThumbnail, getYouTubeEmbed } from "../../utils/youtube";
import { useCourseContext } from "../../contexts/CourseContext";
import { useAccessContext } from "../../contexts/AccessContext";
import { useAccessController } from "../../hooks/useAccessController";
import { useNavigationController } from "../../hooks/useNavigationController";
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Award, BookOpen, Download, FileText, Lock, Play, Video, WandSparkles, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Button, GlassButton, Pill } from '../ui/LegacyUI';
import { StudentTest } from "../test/StudentTest";
import LatexDocument from '../LatexDocument';
import ChapterImage from '../shared/ChapterImage';
import { AnimatePresence, motion } from "framer-motion";

export function ContentTab({ topic }) {
  return (
    <>
      <div className="section-title">
        <h2>{topic.name}</h2>
        <Pill>{topic.videos.length} videos</Pill>
      </div>
      <div className="stack">
        {topic.videos.map((video) => <VideoCard key={video.id} video={video} />)}
      </div>
      {topic.examples.length > 0 && (
        <>
          <div className="section-title divided">
            <h2>Worked Examples</h2>
            <Pill>{topic.examples.length} added</Pill>
          </div>
          <div className="stack">
            {topic.examples.map((video) => <VideoCard key={video.id} video={video} faint />)}
          </div>
        </>
      )}
    </>
  );
}

export function VideoCard({ video, faint = false }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button 
        initial={{ scale: 1 }}
        whileTap={{ scale: 0.98 }}
        className={`video-card ${faint ? "faint" : ""} group`} 
        onClick={() => setOpen(true)}
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
        initial={{ scale: 0.82, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.82, opacity: 0 }}
        transition={{ type: "spring", duration: 0.45, bounce: 0.08 }}
      >
        <Button className="icon-btn close-btn" aria-label="Close video" onClick={onClose}><X size={16} /></Button>
        <iframe
          src={getYouTubeEmbed(video.url)}
          title={video.title}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
        <div>
          <strong>{video.label}</strong>
          <span>{video.title}</span>
        </div>
      </motion.section>
    </motion.div>
  );
}

export function NotesTab({ topic }) {
  const [zoom, setZoom] = useState(1);
  const note = topic.notes[0];
  if (!note) {
    return (
      <div className="empty-state">
        <FileText size={36} />
        <h2>Notes coming soon</h2>
        <p>The mentor has not attached notes for this topic yet.</p>
      </div>
    );
  }

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.5));
  const handleDownload = () => {
    const blob = new Blob([note.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title || "notes"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="pdf-panel">
      {note.type === "latex" ? (
        <React.Suspense fallback={<LatexFallback />}>
          <LatexDocument title={note.title} source={note.content} />
        </React.Suspense>
      ) : (
        <>
          <div className="pdf-toolbar">
            <Button className="icon-btn" aria-label="Previous page"><ArrowLeft size={16} /></Button>
            <span>{note.title} · uploaded PDF</span>
            <Button className="icon-btn" aria-label="Next page"><ArrowRight size={16} /></Button>
            <div className="toolbar-end">
              <Button className="icon-btn" aria-label="Zoom in" onClick={handleZoomIn}><ZoomIn size={16} /></Button>
              <Button className="icon-btn" aria-label="Zoom out" onClick={handleZoomOut}><ZoomOut size={16} /></Button>
              <Button className="icon-btn" aria-label="Download" onClick={handleDownload}><Download size={16} /></Button>
            </div>
          </div>
          <div style={{ overflow: "auto", flex: 1, position: "relative" }}>
            <article className="pdf-page" style={{ transform: `scale(${zoom})`, transformOrigin: "top left", transition: "transform 0.2s ease" }}>
              <h2>{topic.name}</h2>
              <p>{note.content}</p>
            </article>
          </div>
        </>
      )}
    </div>
  );
}

export function LatexFallback({ compact = false }) {
  return (
    <section className={`latex-document ${compact ? "compact" : ""}`} aria-busy="true">
      <div className="pdf-toolbar">
        <span>Loading notes preview...</span>
      </div>
      <article className="latex-page">
        <p>Preparing LaTeX renderer.</p>
      </article>
    </section>
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
  const { initiateSignup } = useAccessController();
  const { goToStudentPortal } = useNavigationController();
  
  const onBack = goToStudentPortal;
  const onPay = () => initiateSignup("signup");

  const availableTopics = access === "full" ? chapter.topics : chapter.topics.filter((topic) => topic.isFree);
  const topic = availableTopics[topicIndex] || availableTopics[0] || chapter.topics[0];

  return (
    <section className="learning-shell">
      <header className="chapter-top">
        <GlassButton type="button" size="icon" onClick={onBack}><ArrowLeft size={18} /></GlassButton>
        <ChapterImage chapter={chapter} className="tiny-cover" />
        <strong>{chapter.name}</strong>
        <Pill tone={access === "full" ? "accent" : "warning"}>{access === "full" ? "full access" : "free topics only"}</Pill>
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
          {chapter.topics.map((item) => {
            const locked = access !== "full" && !item.isFree;
            const visibleIndex = availableTopics.findIndex((topicItem) => topicItem.id === item.id);
            return (
              <button
                key={item.id}
                className={item.id === topic?.id ? "active" : ""}
                onClick={() => (locked ? onPay() : setTopicIndex(visibleIndex))}
              >
                <span>{item.name}</span>
                <small>{locked ? "Premium locked" : `${item.videos.length} videos · ${item.notes.length} notes`}</small>
              </button>
            );
          })}
        </aside>
        <section className="topic-content">
          {tab === "content" && <ContentTab topic={topic} />}
          {tab === "notes" && <NotesTab topic={topic} />}
          {tab === "test" && <StudentTest chapter={chapter} />}
        </section>
      </div>
    </section>
  );
}

