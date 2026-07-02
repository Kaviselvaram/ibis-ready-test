import { useCourseContext } from "../../contexts/CourseContext";

import { useAccessController } from "../../hooks/useAccessController";
import { useNavigationController } from "../../hooks/useNavigationController";
import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, BookOpen, Layers3, Play, Users, Zap, Lock, ArrowUp, ArrowDown, Menu, FileText, CalendarDays, Trophy } from 'lucide-react';
import AnimatedLayerButton, { Brand, Button, GlassButton, Pill, ShinyButton } from '../ui/LegacyUI';
import PortalBadge from '../ui/PortalBadge';
import RockerSwitch from '../ui/RockerSwitch';
import TesplePill from '../ui/TesplePill';
import TextReveal from '../ui/TextReveal';
import ChapterImage from '../shared/ChapterImage';
import ChapterCardStack from '../shared/ChapterCardStack';

export function Proof({ value, label }) {
  return (
    <span>
      <strong>{value}</strong>
      <small>{label}</small>
    </span>
  );
}

export function Feature({ icon, title, copy }) {
  return (
    <div className="glass-card" style={{ width: "100%", height: "100%", padding: "20px", borderRadius: "20px" }}>
      <article style={{ display: "grid", gridTemplateColumns: "auto 1fr", alignItems: "center", gap: "16px", width: "100%" }}>
        <span style={{ display: "grid", placeItems: "center", width: "42px", height: "42px", borderRadius: "12px", color: "var(--paper-soft)", background: "linear-gradient(135deg, var(--clay-dark), var(--clay))", boxShadow: "0 4px 12px rgba(219, 122, 89, 0.2)" }}>{icon}</span>
        <div style={{ display: "grid", gap: "3px" }}>
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "var(--ink)", fontFamily: "var(--display-accent)" }}>{title}</h3>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.86rem", lineHeight: "1.4" }}>{copy}</p>
        </div>
      </article>
    </div>
  );
}

export function StudentChapterShowcase({
  access,
  chapters,
  activeIndex,
  setActiveIndex,
  onOpen
}) {
  const [direction, setDirection] = useState(0);
  const wheelLockRef = useRef(0);
  const activeChapter = chapters[activeIndex] || chapters[0];
  if (!activeChapter) return null;
  
  // Chapter-level access: locked unless the student has full access or this is the free chapter.
  const activeLocked = access !== "full" && activeChapter.isFree !== true;
  const directionClass = direction < 0 ? "from-previous" : "from-next";

  const moveChapter = (step) => {
    if (!chapters.length) return;
    setDirection(step);
    setActiveIndex((current) => (current + step + chapters.length) % chapters.length);
  };

  const handleWheel = (event) => {
    event.preventDefault();
    const now = Date.now();
    if (now - wheelLockRef.current < 560 || Math.abs(event.deltaY) < 16) return;
    wheelLockRef.current = now;
    moveChapter(event.deltaY > 0 ? 1 : -1);
  };

  const progressDots = chapters.map((item, index) => (
    <button
      key={item.id}
      type="button"
      className={index === activeIndex ? "active" : ""}
      aria-label={`Show chapter ${index + 1}: ${item.name}`}
      onClick={() => {
        setDirection(index > activeIndex ? 1 : -1);
        setActiveIndex(index);
      }}
    />
  ));

  return (
    <section className="student-chapter-showcase" onWheel={handleWheel}>
      <div className="student-showcase-main">
        <div className="student-showcase-top">
          <div>
            <span>Chapter {activeIndex + 1} of {chapters.length}</span>
            <strong>{activeChapter.progress}% complete</strong>
          </div>
          <Pill tone={access === "full" ? "accent" : "warning"}>{access === "full" ? "full access" : "trial access"}</Pill>
        </div>

        <div className="student-deck-stage" aria-live="polite">
          <article
            key={activeChapter.id}
            className={`student-feature-chapter-card ${directionClass} ${activeLocked ? "locked" : ""}`}
          >
            <img
              className="student-feature-image"
              src={activeChapter.image}
              alt={`${activeChapter.name} thumbnail`}
              loading="eager"
              decoding="async"
              draggable={false}
            />
            <div className="student-feature-scrim" />
            {activeLocked && (
              <span className="student-feature-lock"><Lock size={15} /> Full access</span>
            )}
            <div className="student-feature-copy">
              <span>Chapter {activeIndex + 1} · {activeChapter.progress}% complete</span>
              <h2>{activeChapter.name}</h2>
              <p>{activeChapter.topics.slice(0, 3).map((topic) => topic.name).join(" · ")}</p>
            </div>
            <GlassButton type="button" size="default" className="student-feature-read" contentClassName="student-feature-read-text" onClick={onOpen}>
              <span>{activeLocked ? "Unlock" : "Read"}</span>
              <ArrowRight size={18} />
            </GlassButton>
          </article>
        </div>

        <div className="student-showcase-footer">
          <div className="student-chapter-dots">{progressDots}</div>
          <GlassButton type="button" size="default" className="student-open-glass" contentClassName="student-open-glass-text" onClick={onOpen}>
            {activeLocked ? <Lock size={17} /> : <ArrowRight size={17} />}
            <span>{activeLocked ? "Unlock selected chapter" : "Open selected chapter"}</span>
          </GlassButton>
        </div>
      </div>

      <div className="student-deck-controls" aria-label="Chapter navigation">
        <GlassButton type="button" size="icon" aria-label="Previous chapter" onClick={() => moveChapter(-1)}>
          <ArrowUp size={19} />
        </GlassButton>
        <span>{String(activeIndex + 1).padStart(2, "0")}</span>
        <GlassButton type="button" size="icon" aria-label="Next chapter" onClick={() => moveChapter(1)}>
          <ArrowDown size={19} />
        </GlassButton>
      </div>
    </section>
  );
}

export default function Landing({ onWhyIbis: sessionOnWhyIbis }) {
  const { chapters, chapterIndex, setChapterIndex } = useCourseContext();
  const { enterPortal, initiateSignup, initiateCheckout } = useAccessController();
  const { goToAdmin, goToWhyIbis } = useNavigationController();
  
  const onTrial = () => enterPortal("trial");
  const onStart = () => initiateSignup("signup");
  const onPricing = () => initiateCheckout("landing");
  const onAdmin = goToAdmin;
  const onWhyIbis = sessionOnWhyIbis || goToWhyIbis;

  const [menuOpen, setMenuOpen] = useState(false);
  const studentFeatures = [
    {
      icon: <BookOpen size={20} />,
      title: "Curated videos",
      copy: "Only the lessons you actually need, arranged chapter by chapter."
    },
    {
      icon: <FileText size={20} />,
      title: "Easy concepts",
      copy: "Understand the idea first, then formulas and numericals feel natural."
    },
    {
      icon: <CalendarDays size={20} />,
      title: "Track + test",
      copy: "See progress, study rhythm, and practice tests in one place."
    },
    {
      icon: <Trophy size={20} />,
      title: "Ace physics",
      copy: "Build board confidence with a style that feels clear, sharp, and premium."
    }
  ];

  return (
    <section className="landing-screen" style={{ position: "relative" }}>
      <svg className="liquid-glass-filter" aria-hidden="true">
        <defs>
          <filter id="landing-liquid-glass" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.018 0.045" numOctaves="2" seed="7" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="1.8" result="blurredNoise" />
            <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="22" xChannelSelector="R" yChannelSelector="B" result="displaced" />
            <feGaussianBlur in="displaced" stdDeviation="0.35" result="softened" />
            <feComposite in="softened" in2="softened" operator="over" />
          </filter>
        </defs>
      </svg>

      <PortalBadge />

      {/* Floating Logo Top-Left */}
      <div style={{ position: "absolute", top: "24px", left: "24px", zIndex: 50 }}>
        <Brand compact={true} />
      </div>

      {/* Floating Top-Right Actions */}
      <div style={{ position: "absolute", top: "24px", right: "24px", zIndex: 100, display: "flex", alignItems: "center", gap: "16px" }}>
        <RockerSwitch checked={false} onChange={(val) => { if (val) onWhyIbis(); }} />
        <TesplePill />
        <div className="glass-dropdown-wrapper">
          <Button className="icon-btn subtle" aria-label="Menu" onClick={() => setMenuOpen(!menuOpen)}>
            <Menu size={18} />
          </Button>
          {menuOpen && (
            <>
              <div 
                style={{ position: "fixed", inset: 0, zIndex: 99, cursor: "default" }} 
                onClick={() => setMenuOpen(false)} 
              />
              <div className="glass-dropdown-menu" style={{ zIndex: 100 }}>
                <button 
                  className="glass-dropdown-item" 
                  onClick={() => { setMenuOpen(false); onPricing(); }}
                >
                  Pricing
                </button>
                <button 
                  className="glass-dropdown-item" 
                  onClick={() => { setMenuOpen(false); onAdmin(); }}
                >
                  Admin
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="landing-grid" style={{ position: "relative", zIndex: 1 }}>
        <section className="hero-copy">
          <h1 className="hero-editorial-title" aria-label="Physics that finally clicks">
            <span className="title-line line-one">
              <span className="hero-doodle hero-doodle-burst" aria-hidden="true" />
              <span className="ink-word">Physics</span>
            </span>
            <span className="title-line line-two">
              <span className="sun-word">that</span>
              <span className="ink-word">finally</span>
              <span className="hero-doodle hero-doodle-triangle" aria-hidden="true" />
            </span>
            <span className="title-line line-three">
              <span className="ink-word">clicks</span>
              <span className="hero-doodle hero-doodle-underline" aria-hidden="true" />
            </span>
          </h1>
          <div className="hero-actions hero-actions-polished">
            <AnimatedLayerButton className="hero-trial-layer-btn" hoverText="Try" onClick={onTrial}>Free trial</AnimatedLayerButton>
            <ShinyButton className="hero-start-shiny" onClick={onStart}>Start learning</ShinyButton>
          </div>
        </section>

        <section className="hero-subject-showcase">
          <div className="subject-card">
            <img
              src="/ibis-assets/herosubject.webp?v=20260626"
              alt="Physics Subject Illustration"
              className="subject-image"
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </section>
      </div>

      <section className="landing-feature-rail" aria-label="Student features">
        {studentFeatures.map((feature) => (
          <article
            className="landing-feature-card"
            key={feature.title}
          >
            <span className="landing-feature-glass-shadow" aria-hidden="true" />
            <span className="landing-feature-glass" aria-hidden="true" />
            <span className="landing-feature-icon">{feature.icon}</span>
            <strong>{feature.title}</strong>
            <p>{feature.copy}</p>
          </article>
        ))}
      </section>
    </section>
  );
}

