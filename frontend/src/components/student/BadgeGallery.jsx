import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Play, ClipboardList, Circle, Triangle, Flame, LogIn, BookOpen, Target,
  Lock, Award, X, Sparkles
} from "lucide-react";

const ICONS = {
  play: Play, clipboard: ClipboardList, circle: Circle, triangle: Triangle,
  flame: Flame, "log-in": LogIn, book: BookOpen, target: Target
};

// Rarity → gradient stops + glow. Mythic is deliberately the most prestigious.
export const RARITY_STYLE = {
  common: { from: "#8a9a8f", to: "#5c6f63", glow: "rgba(92,111,99,0.0)", ring: "#7c8a80" },
  rare: { from: "#5aa0d6", to: "#2f6ea8", glow: "rgba(79,131,168,0.45)", ring: "#4f83a8" },
  epic: { from: "#a679d6", to: "#6d3fa0", glow: "rgba(138,109,176,0.5)", ring: "#8a6db0" },
  legendary: { from: "#f0c45a", to: "#d7a154", glow: "rgba(215,161,84,0.6)", ring: "#c99a3a" },
  mythic: { from: "#ffb057", to: "#c9412a", glow: "rgba(201,65,42,0.75)", ring: "#c9412a" }
};

// Premium hexagonal medallion. Earned = full gradient + glow; locked = muted with
// a progress arc showing how close the student is.
export function BadgeMedallion({ badge, size = 78 }) {
  const Icon = ICONS[badge.icon] || Award;
  const style = RARITY_STYLE[badge.rarity] || RARITY_STYLE.common;
  const earned = badge.earned;
  const gid = `bm-${badge.key}`;
  const cx = size / 2;
  const r = size / 2 - 4;
  // hexagon points
  const hex = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${(cx + Math.cos(a) * r).toFixed(1)},${(cx + Math.sin(a) * r).toFixed(1)}`;
  }).join(" ");
  const C = 2 * Math.PI * (r - 2);
  const prog = Math.max(0, Math.min(100, badge.progress || 0));

  return (
    <div
      className={`badge-medallion rarity-${badge.rarity} ${earned ? "earned" : "locked"} ${badge.rarity === "mythic" && earned ? "mythic-anim" : ""}`}
      style={{ width: size, height: size, "--glow": style.glow }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={style.from} />
            <stop offset="100%" stopColor={style.to} />
          </linearGradient>
        </defs>
        <polygon points={hex} fill={earned ? `url(#${gid})` : "rgba(44,31,24,0.08)"}
          stroke={earned ? "rgba(255,255,255,0.35)" : "rgba(44,31,24,0.12)"} strokeWidth="1.5" />
        {!earned && (
          <circle cx={cx} cy={cx} r={r - 2} fill="none" stroke={style.ring} strokeWidth="2.5"
            strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C - (prog / 100) * C}
            transform={`rotate(-90 ${cx} ${cx})`} opacity="0.7" />
        )}
      </svg>
      <span className="badge-medallion-icon" style={{ color: earned ? "#fff" : "var(--muted)" }}>
        {earned ? <Icon size={size * 0.34} /> : <Lock size={size * 0.28} />}
      </span>
    </div>
  );
}

function BadgeCard({ badge }) {
  return (
    <motion.div
      className={`badge-card ${badge.earned ? "is-earned" : "is-locked"}`}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      whileHover={{ y: -3 }}
    >
      <BadgeMedallion badge={badge} />
      <div className="badge-card-body">
        <strong>{badge.label}</strong>
        <small>{badge.description}</small>
        {badge.earned ? (
          <span className="badge-chip earned"><Sparkles size={11} /> {badge.manual ? "Awarded" : "Earned"}</span>
        ) : (
          <div className="badge-progress">
            <div className="badge-progress-track"><i style={{ width: `${badge.progress}%` }} /></div>
            <span>{badge.value}/{badge.threshold}</span>
          </div>
        )}
      </div>
      <span className={`badge-rarity-tag rarity-${badge.rarity}`}>{badge.rarity}</span>
    </motion.div>
  );
}

// Compact strip for the dashboard: earned count + a few next-to-earn medallions.
export function BadgeStrip({ data, onOpen }) {
  if (!data) return null;
  const earned = data.badges.filter((b) => b.earned);
  const next = data.badges
    .filter((b) => !b.earned)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 4);
  const showcase = (earned.slice(-4).length ? earned.slice(-4) : []).concat(next).slice(0, 6);
  return (
    <button type="button" className="badge-strip" onClick={onOpen}>
      <div className="badge-strip-head">
        <span><Award size={15} /> Badges</span>
        <b>{data.earnedCount}/{data.total}</b>
      </div>
      <div className="badge-strip-medals">
        {showcase.map((b) => <BadgeMedallion key={b.key} badge={b} size={44} />)}
      </div>
      <span className="badge-strip-cta">View all badges →</span>
    </button>
  );
}

// Full gallery (modal-friendly): filter tabs + grouped grid.
export function BadgeGallery({ data, onClose }) {
  const [filter, setFilter] = useState("all"); // all | earned | <category>
  const cats = data?.categories || [];

  const visible = useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data.badges;
    if (filter === "earned") return data.badges.filter((b) => b.earned);
    return data.badges.filter((b) => b.category === filter);
  }, [data, filter]);

  if (!data) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal badge-gallery-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="icon-btn close-btn" aria-label="Close" onClick={onClose}><X size={16} /></button>
        <div className="badge-gallery-head">
          <div>
            <h2><Award size={20} /> Badge Collection</h2>
            <p>{data.earnedCount} of {data.total} earned · keep learning to unlock more.</p>
          </div>
        </div>

        <div className="badge-gallery-filters">
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All</button>
          <button className={filter === "earned" ? "active" : ""} onClick={() => setFilter("earned")}>Earned</button>
          {cats.map((c) => (
            <button key={c.key} className={filter === c.key ? "active" : ""} onClick={() => setFilter(c.key)}>{c.label}</button>
          ))}
        </div>

        <div className="badge-gallery-grid">
          {visible.map((b) => <BadgeCard key={b.key} badge={b} />)}
          {visible.length === 0 && <p className="tc-empty">No badges in this filter yet.</p>}
        </div>
      </div>
    </div>
  );
}
