import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Lock } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { GlassButton } from '../ui/LegacyUI';

export default function ChapterCardStack({
  chapters,
  activeIndex,
  setActiveIndex,
  className = "",
  mode = "hero",
  onOpen,
  locked = false
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const visibleCards = [0, 1, 2].map((offset) => {
    const chapterIndex = (activeIndex + offset) % chapters.length;
    const chapter = chapters[chapterIndex];
    return { chapter, stackIndex: offset, chapterNumber: chapterIndex + 1 };
  });

  const changeChapter = (nextIndex) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex((nextIndex + chapters.length) % chapters.length);
    window.setTimeout(() => setIsAnimating(false), 850);
  };

  const animateNext = () => {
    changeChapter(activeIndex + 1);
  };

  return (
    <section className={`chapter-card-stack ${mode} ${className}`} aria-label="Animated chapter stack">
      <div className="stack-stage">
        <AnimatePresence initial={false}>
          {visibleCards.map(({ chapter, stackIndex, chapterNumber }) => (
            <motion.div
              key={chapter.id}
              initial={stackIndex === 2 ? { y: -16, scale: 0.9 } : false}
              animate={stackPositionStyles[stackIndex]}
              exit={{ y: 340, scale: 1, zIndex: 10 }}
              transition={{
                type: "spring",
                duration: 1,
                bounce: 0,
              }}
              style={{
                zIndex: stackIndex === 0 && isAnimating ? 10 : 3 - stackIndex,
                left: "50%",
                x: "-50%",
                bottom: 0,
              }}
              className="animated-chapter-card"
            >
              <div className="flex-card-stack-inner">
                <div className="card-stack-image-wrap">
                  <img
                    src={chapter.image}
                    alt={chapter.name}
                    className="card-stack-image"
                    loading={stackIndex === 0 ? "eager" : "lazy"}
                    decoding="async"
                    draggable="false"
                  />
                  {locked && stackIndex === 0 && <span className="lock-chip"><Lock size={15} /> Premium</span>}
                </div>
                <div className="card-stack-info-row">
                  <div className="card-stack-text-col">
                    <span className="card-stack-chapter-label">
                      Chapter {chapterNumber} {mode === "student" ? ` · ${chapter.progress}% complete` : " · Board Course"}
                    </span>
                    <span className="card-stack-chapter-title">{chapter.name}</span>
                  </div>
                  <button 
                    className="card-stack-action-btn"
                    onClick={stackIndex === 0 ? (onOpen || animateNext) : () => changeChapter(activeIndex + stackIndex)}
                  >
                    <span>Read</span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="square"
                    >
                      <path d="M9.5 18L15.5 12L9.5 6" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="stack-controls">
        <GlassButton size="icon" aria-label="Previous chapter" disabled={isAnimating} onClick={() => changeChapter(activeIndex - 1)}><ArrowLeft size={18} /></GlassButton>
        <div className="dots">
          {chapters.map((chapter, index) => (
            <button
              key={chapter.id}
              className={index === activeIndex ? "active" : ""}
              aria-label={`Show ${chapter.name}`}
              disabled={isAnimating}
              onClick={() => changeChapter(index)}
            />
          ))}
        </div>
        <GlassButton size="icon" aria-label="Next chapter" disabled={isAnimating} onClick={animateNext}><ArrowRight size={18} /></GlassButton>
      </div>
    </section>
  );
}

