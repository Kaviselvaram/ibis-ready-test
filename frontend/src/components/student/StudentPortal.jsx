import { useAuthenticationController } from "../../hooks/useAuthenticationController";
import { useCourseContext } from "../../contexts/CourseContext";
import { useCourseController } from "../../hooks/useCourseController";
import { useAccessContext } from "../../contexts/AccessContext";
import { useAccessController } from "../../hooks/useAccessController";
import { useUI } from "../../contexts/UIContext";
import { useToast, friendlyMessage } from "../../contexts/ToastContext";
import { BatchRepository } from "../../repositories/BatchRepository";
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, BookOpen, Check, Flame, Layers3, Lock, LogOut, ReceiptIndianRupee, Trophy, Users, X, Zap, Clipboard, ClipboardList, CalendarDays, TrendingUp, Medal, Star, Bell, ShieldCheck, Sparkles, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Brand, Button, GlassButton, Pill, ShinyButton } from '../ui/LegacyUI';
import TextReveal from '../ui/TextReveal';
import GradientBlobCard from '../ui/GradientBlobCard';
import ChapterCardStack from '../shared/ChapterCardStack';
import { StudentChapterShowcase } from '../common/Landing';

export function getCalendarDays(year, month) {
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    days.push(d);
  }
  return days;
}

export function getStudyCalendar(studyDataByDay, baseDate = new Date()) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const today = baseDate.getDate();
  const monthName = baseDate.toLocaleString("en-IN", { month: "long" });
  const days = getCalendarDays(year, month);
  const safeData = studyDataByDay || {};
  const activeDays = Object.keys(safeData).filter((day) => Number(day) <= new Date(year, month + 1, 0).getDate()).length;
  const totalMinutes = Object.values(safeData).reduce((sum, day) => sum + day.minutes, 0);
  // Current streak: consecutive active days ending today.
  let streak = 0;
  for (let d = today; d >= 1; d--) {
    if (safeData[d]) streak++; else break;
  }
  return { year, month, today, monthName, days, activeDays, totalMinutes, streak };
}

export function CalendarCard({ onClick, isNested = false }) {
  const { studyData } = useCourseContext();
  const { year, today, monthName, days, activeDays, streak } = getStudyCalendar(studyData || {});

  const Tag = isNested ? "div" : "button";
  const extraProps = isNested ? {} : { onClick };

  const todayStudied = Boolean((studyData || {})[today]);
  // A gentle nudge when today's streak isn't logged yet — a real, data-driven cue.
  const showNudge = !todayStudied && streak > 0;

  return (
    <Tag
      className="metric-card calendar-card calendar-card-live"
      style={isNested ? { background: "transparent", border: "none", boxShadow: "none", padding: "14px 16px 16px" } : {}}
      {...extraProps}
    >
      <div className="card-header-row">
        <CalendarDays />
        <span>Study rhythm</span>
        {showNudge && (
          <span className="calendar-notif" title="Keep your streak alive today">
            <Bell size={11} /><i className="calendar-notif-pip" />
          </span>
        )}
      </div>
      <div className="calendar-header-title">
        <strong>{monthName} {year}</strong>
        {streak > 0 && (
          <span className="streak-badge streak-badge-live">
            <Flame size={12} className="streak-flame" /> {streak} day streak
          </span>
        )}
      </div>
      <div className="calendar-grid-wrapper">
        {/* Always-on animated beam sweeping across the month — no click needed. */}
        <span className="calendar-beam" aria-hidden="true" />
        <div className="weekdays-row">
          <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
        </div>
        <div className="calendar-days-grid">
          {days.map((day, idx) => {
            if (day === null) return <span key={`empty-${idx}`} className="day-cell empty" />;
            const isToday = day === today;
            const data = (studyData || {})[day];
            // Consecutive active run ending today → highlight as the live streak.
            const inStreak = streak > 0 && day <= today && day > today - streak;
            let cellClass = "";
            if (data) cellClass += ` ${data.type} done`;
            if (inStreak) cellClass += " in-streak";
            if (isToday) cellClass += " today";
            return (
              <span key={`day-${day}`} className={`day-cell${cellClass}`} style={data ? { "--cell-delay": `${(idx % 7) * 0.06}s` } : undefined}>
                {day}
                {isToday && <span className="today-dot" />}
              </span>
            );
          })}
        </div>
      </div>
      <span className="calendar-card-footer">
        {showNudge ? "Study today to extend your streak · open calendar" : `${activeDays} active days this month · open calendar`}
      </span>
    </Tag>
  );
}

export function StatsModal({ onClose, chapters }) {
  const { studyData } = useCourseContext();
  const { year, today, monthName, days, totalMinutes } = getStudyCalendar(studyData || {});
  const [selectedDay, setSelectedDay] = useState(today);
  const selectedData = (studyData || {})[selectedDay];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal wide-modal" onClick={(e) => e.stopPropagation()}>
        <Button className="icon-btn close-btn" aria-label="Close modal" onClick={onClose}><X size={16} /></Button>
        <div>
          <Pill tone="accent">Study Progress & Metrics</Pill>
          <h2 style={{ marginTop: "6px", marginBottom: "4px" }}>Study Rhythm & Progress Dashboard</h2>
        </div>
        
        <div className="stats-dashboard-grid">
          <div className="stats-left">
            <h3 className="modal-section-title">{monthName} {year} Calendar</h3>
            <div className="large-calendar-grid">
              <div className="weekdays-row" style={{ marginBottom: "6px" }}>
                <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
              </div>
              <div className="large-calendar-days">
                {days.map((day, idx) => {
                  if (day === null) return <span key={`empty-${idx}`} className="day-cell empty" />;
                  const isToday = day === today;
                  const data = (studyData || {})[day];
                  let cellClass = "";
                  if (data) cellClass += ` ${data.type}`;
                  if (isToday) cellClass += " today";
                  if (selectedDay === day) cellClass += " active-selected";
                  return (
                    <button 
                      key={`day-${day}`} 
                      className={`day-cell${cellClass}`}
                      onClick={() => setSelectedDay(day)}
                      style={selectedDay === day ? { borderColor: "var(--clay-dark)", borderWidth: "2px" } : {}}
                    >
                      {day}
                      {isToday && <span className="today-dot" />}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="calendar-legend">
              <div className="legend-item">
                <span className="legend-color none" />
                <span>No study</span>
              </div>
              <div className="legend-item">
                <span className="legend-color warm" />
                <span>Active study (0 - 60m)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color hot" />
                <span>Deep focus (60m+)</span>
              </div>
            </div>

            <div className="detail-bubble">
              <strong>{monthName} {selectedDay}, {year}</strong>
              {selectedData ? (
                <span>
                  Studied for <strong>{selectedData.minutes} minutes</strong>. Covered <strong>{selectedData.lessons} lessons</strong> and completed <strong>{selectedData.tests} practice tests</strong>.
                </span>
              ) : (
                <span>No study recorded for this day. Rest and recovery.</span>
              )}
            </div>
          </div>
          
          <div className="stats-right">
            <h3 className="modal-section-title">Performance Summary</h3>
            <div className="stats-summary-grid">
              <div className="stat-bubble">
                <span>Current Streak</span>
                <strong>3 Days</strong>
              </div>
              <div className="stat-bubble">
                <span>Max Streak</span>
                <strong>14 Days</strong>
              </div>
              <div className="stat-bubble">
                <span>Total Study Time</span>
                <strong>{(totalMinutes / 60).toFixed(1)} Hours</strong>
              </div>
              <div className="stat-bubble">
                <span>Worked Examples</span>
                <strong>32 Solved</strong>
              </div>
            </div>

            <h3 className="modal-section-title" style={{ marginTop: "8px" }}>Syllabus Coverage</h3>
            <div className="chapter-progress-list">
              {chapters.slice(0, 5).map((ch, chIndex) => (
                <div key={ch.id} className="chapter-progress-item">
                  <div className="chapter-progress-header">
                    <span>Ch {chIndex + 1}: {ch.name}</span>
                    <strong>{ch.progress}%</strong>
                  </div>
                  <div className="progress-line">
                    <i style={{ width: `${ch.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LeaderboardModal({ onClose }) {
  const { leaderboard } = useCourseContext();
  const cohort = leaderboard || [];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal wide-modal" style={{ maxWidth: "680px" }} onClick={(e) => e.stopPropagation()}>
        <Button className="icon-btn close-btn" aria-label="Close modal" onClick={onClose}><X size={16} /></Button>
        <div>
          <Pill tone="accent">Cohort Leaderboard</Pill>
          <h2 style={{ marginTop: "6px", marginBottom: "4px" }}>Board Intensive Rankings</h2>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>
            Compare your study time, board accuracy, and total tests solved against your batch.
          </p>
        </div>
        
        <div className="leaderboard-list">
          {cohort.map((student) => {
            const initials = student.name.split(" ").map(p => p[0]).join("");
            return (
              <div key={student.rank} className={`leaderboard-item${student.isMe ? " me" : ""}`}>
                <span className="leaderboard-rank">#{student.rank}</span>
                <span className="leaderboard-avatar">{initials}</span>
                <div className="leaderboard-info">
                  <span className="leaderboard-name">{student.name} {student.isMe && "(You)"}</span>
                  <span className="leaderboard-meta">Active {student.active} · {student.badges} badges</span>
                </div>
                <div className="leaderboard-stats">
                  <div>
                    <div style={{ fontSize: "0.65rem", textTransform: "uppercase", color: "var(--muted)", fontWeight: 800 }}>Study Time</div>
                    <div style={{ fontWeight: 700 }}>{student.studyTime}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.65rem", textTransform: "uppercase", color: "var(--muted)", fontWeight: 800 }}>Accuracy</div>
                    <div style={{ fontWeight: 700 }}>{student.accuracy}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.65rem", textTransform: "uppercase", color: "var(--muted)", fontWeight: 800 }}>Board Score</div>
                    <div className="leaderboard-score">{student.score}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ActivityRings() {
  const rings = [
    { value: 74, color: "#c95f42", label: "Progress" },
    { value: 62, color: "#d7a154", label: "Practice" },
    { value: 41, color: "#4f6f5e", label: "Tests" }
  ];

  return (
    <div className="activity-rings" aria-label="Study activity rings">
      <svg viewBox="0 0 120 120" role="img">
        {rings.map((ring, index) => {
          const radius = 49 - index * 13;
          const circumference = 2 * Math.PI * radius;
          const dash = (ring.value / 100) * circumference;
          return (
            <g key={ring.label}>
              <circle className="ring-track" cx="60" cy="60" r={radius} />
              <circle
                className="ring-fill"
                cx="60"
                cy="60"
                r={radius}
                stroke={ring.color}
                strokeDasharray={`${dash} ${circumference - dash}`}
              />
            </g>
          );
        })}
      </svg>
      <span>
        <b>3-ring pace</b>
        <small>Lessons · practice · tests</small>
      </span>
    </div>
  );
}

export function Paywall({ onPay, onClose }) {
  return (
    <div className="overlay">
      <section className="modal paywall">
        <Pill tone="warning">Premium chapter</Pill>
        <h2>Unlock every lesson in the syllabus deck.</h2>
        <p>The trial shows the real portal with selected free topics. Continue with Full Access to open all chapters, notes, and worked examples.</p>
        <div className="modal-actions">
          <Button onClick={onClose}>Keep browsing</Button>
          <Button variant="primary" onClick={onPay}>Sign up and pay</Button>
        </div>
      </section>
    </div>
  );
}

export function BatchModal({ onClose }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const { setMyBatch } = useUI();
  const { setLeaderboard } = useCourseContext();
  const toast = useToast();

  const join = async () => {
    const clean = code.trim();
    if (!clean || busy) return;
    setBusy(true);
    try {
      const batch = await BatchRepository.joinBatch(clean);
      setMyBatch(batch);
      setLeaderboard([]); // force a batch-scoped leaderboard refetch
      toast.success(`Joined ${batch.school ? batch.school + " · " : ""}${batch.name}`);
      onClose();
    } catch (e) {
      toast.error(friendlyMessage(e, "Couldn’t join that batch. Check the code."));
      setBusy(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <section className="modal" onClick={(e) => e.stopPropagation()}>
        <Button className="icon-btn close-btn" aria-label="Close" onClick={onClose}><X size={16} /></Button>
        <h2>Enter Batch Code</h2>
        <p>Link your account to a teacher-controlled school batch. You’ll rank against your batch peers.</p>
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === "Enter") join(); }}
          placeholder="e.g. DPS-XII-2026"
          autoFocus
        />
        <div className="modal-actions">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={join} disabled={busy || !code.trim()}><Check size={16} /> {busy ? "Joining…" : "Link batch"}</Button>
        </div>
      </section>
    </div>
  );
}

// Gamification "batches" (tiers) derived entirely from real backend signals:
// the student's live streak (study calendar), badge count and rank (leaderboard).
export function computeTiers({ streak = 0, badges = 0, rank = null }) {
  return [
    { key: "streak", name: "Streak Keeper", icon: Flame, earned: streak >= 3, hint: streak >= 3 ? `${streak}-day streak` : `${streak}/3 days` },
    { key: "sharp", name: "Sharpshooter", icon: Star, earned: badges >= 3, hint: badges >= 3 ? `${badges} badges` : `${badges}/3 badges` },
    { key: "rank", name: "Podium", icon: Medal, earned: !!rank && rank <= 3, hint: rank ? `Rank #${rank}` : "Take a test" },
    { key: "consistent", name: "Consistency", icon: ShieldCheck, earned: streak >= 7, hint: streak >= 7 ? "7-day run" : `${streak}/7 days` }
  ];
}

export function RankStack({ leaderboard, streak, onOpenLeaderboard }) {
  const [peek, setPeek] = useState(false);
  const me = leaderboard?.find((s) => s.isMe);
  const rank = me?.rank || null;
  const badges = me?.badges || 0;
  const tiers = computeTiers({ streak, badges, rank });
  const earned = tiers.filter((t) => t.earned).length;

  return (
    <div
      className={`rank-stack ${peek ? "peek" : ""}`}
      onMouseEnter={() => setPeek(true)}
      onMouseLeave={() => setPeek(false)}
    >
      {/* Card BEHIND the rank card — gamification batches. */}
      <motion.div
        className="gamify-card"
        initial={false}
        animate={{ y: peek ? -18 : 0, scale: peek ? 1 : 0.965 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
      >
        <div className="gamify-head">
          <span><Sparkles size={14} /> Gamification badges</span>
          <b>{earned}/{tiers.length}</b>
        </div>
        <div className="gamify-grid">
          {tiers.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.key} className={`gamify-tier ${t.earned ? "earned" : "locked"}`}>
                <span className="gamify-tier-ic"><Icon size={16} /></span>
                <strong>{t.name}</strong>
                <small>{t.hint}</small>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Front rank card — reuses the existing GradientBlobCard treatment. */}
      <motion.div
        className="rank-front"
        initial={false}
        animate={{ y: peek ? 6 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
      >
        <GradientBlobCard onClick={onOpenLeaderboard} className="achievement-card">
          <div className="metric-card" style={{ background: "transparent", border: "none", boxShadow: "none", padding: "16px", cursor: "pointer", display: "grid", gap: "10px", width: "100%" }}>
            <Trophy />
            <span>Current rank</span>
            <strong style={{ fontFamily: "var(--display-accent)" }}>#{rank || '-'}</strong>
            <small>{badges} badges earned · tap for leaderboard</small>
            <div className="mini-leaderboard">
              {leaderboard?.slice(0, 2).map((s) => (
                <b key={s.id}>#{s.rank} {s.name.split(" ")[0]}</b>
              ))}
              <b>#{rank || '-'} You</b>
            </div>
          </div>
        </GradientBlobCard>
        <button type="button" className="rank-peek-toggle" onClick={(e) => { e.stopPropagation(); setPeek((p) => !p); }}>
          <ChevronUp size={13} className={peek ? "flip" : ""} /> {earned}/{tiers.length} badges
        </button>
      </motion.div>
    </div>
  );
}

export default function StudentPortal() {
  const { chapters, chapterIndex, setChapterIndex, leaderboard, studyData } = useCourseContext();
  const { streak } = getStudyCalendar(studyData || {});
  const { switchChapter, openChapter } = useCourseController();
  const { access } = useAccessContext();
  const { initiateSignup } = useAccessController();
  const { signOut, user } = useAuthenticationController();
  const { setBatchOpen, paywall: showPaywall, setPaywall, myBatch, setMyBatch } = useUI();
  const navigate = useNavigate();

  // Load the student's connected batch once (undefined = not yet fetched).
  useEffect(() => {
    if (myBatch === undefined) {
      BatchRepository.getMyBatch().then((b) => setMyBatch(b || null)).catch(() => setMyBatch(null));
    }
  }, [myBatch, setMyBatch]);

  const onBatch = () => setBatchOpen(true);
  const onTakeTest = () => navigate("/test-center");
  const onProgress = () => navigate("/progress");
  const onLogout = signOut;
  const onPay = () => initiateSignup("signup");
  const onClosePaywall = () => setPaywall(false);

  const chapter = chapters[chapterIndex];

  const [statsOpen, setStatsOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

  return (
    <section className="app-shell">
      <header className="topbar portal-bar">
        <strong className="student-name">{user?.name || "Student"}</strong>
        {myBatch ? (
          <button className="portal-batch-chip" onClick={onBatch} title="Change batch">
            <Users size={14} />
            <span>{myBatch.school ? `${myBatch.school} · ` : ""}{myBatch.name}</span>
            <small>{myBatch.code}</small>
          </button>
        ) : (
          <Button variant="ghost" onClick={onBatch}><Clipboard size={16} /> Enter batch code</Button>
        )}
        <Button variant="ghost" onClick={onProgress}><TrendingUp size={16} /> My Progress</Button>
        <Button variant="primary" onClick={onTakeTest}><ClipboardList size={16} /> Take Test</Button>
        <Button onClick={onLogout}><LogOut size={16} /> Log out</Button>
      </header>

      <div className="portal-grid">
        <motion.aside
          className="student-side"
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <RankStack
            leaderboard={leaderboard}
            streak={streak}
            onOpenLeaderboard={() => setLeaderboardOpen(true)}
          />

          <motion.div whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300, damping: 24 }}>
            <GradientBlobCard onClick={() => setStatsOpen(true)} className="stat-card">
              <CalendarCard isNested={true} />
            </GradientBlobCard>
          </motion.div>
        </motion.aside>

        <section className="chapter-switcher">
          <StudentChapterShowcase
            access={access}
            chapters={chapters}
            activeIndex={chapterIndex}
            setActiveIndex={setChapterIndex}
            onOpen={openChapter}
          />
        </section>
      </div>

      {showPaywall && <Paywall onPay={onPay} onClose={onClosePaywall} />}
      {statsOpen && <StatsModal onClose={() => setStatsOpen(false)} chapters={chapters} />}
      {leaderboardOpen && <LeaderboardModal onClose={() => setLeaderboardOpen(false)} />}
    </section>
  );
}

