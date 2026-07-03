import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Flame, Trophy, Target, TrendingUp, Award, Brain, BookOpen,
  ClipboardList, CheckCircle2, Zap, Star, Lock, BarChart3
} from "lucide-react";
import { StudentRepository } from "../../repositories/StudentRepository";
import { GlassButton, Button } from "../ui/LegacyUI";

const band = (n) => (n >= 75 ? "high" : n >= 45 ? "mid" : "low");
const BADGE_ICON = {
  first_test: Star, streak_3: Flame, dedicated: ClipboardList, sharpshooter: Target,
  centurion: CheckCircle2, mock_master: Trophy, explorer: BookOpen
};

export default function ProgressDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    StudentRepository.getProgress()
      .then((d) => { if (active) setData(d); })
      .catch(() => { if (active) setError("Couldn’t load your progress. Please try again."); });
    return () => { active = false; };
  }, []);

  if (error) {
    return (
      <section className="prog">
        <ProgHeader navigate={navigate} />
        <div className="prog-empty"><BarChart3 size={34} /><p>{error}</p></div>
      </section>
    );
  }
  if (!data) {
    return (
      <section className="prog">
        <ProgHeader navigate={navigate} />
        <p className="tc-empty">Loading your progress…</p>
      </section>
    );
  }

  const { totals, streak, level, chapters, byBloom, byDifficulty, trend, badges } = data;
  const xpPct = level.xpForLevel ? Math.min(100, Math.round((level.xpIntoLevel / level.xpForLevel) * 100)) : 0;

  if (totals.tests === 0) {
    return (
      <section className="prog">
        <ProgHeader navigate={navigate} />
        <div className="prog-empty">
          <Target size={40} />
          <h2>No progress yet</h2>
          <p>Take your first practice test and your analytics, mastery and badges will appear here.</p>
          <Button variant="primary" onClick={() => navigate("/test-center")}><ClipboardList size={16} /> Take a test</Button>
        </div>
      </section>
    );
  }

  const attemptedChapters = chapters.filter((c) => c.questionsAttempted > 0);
  const maxTrend = 100;

  return (
    <section className="prog">
      <ProgHeader navigate={navigate} />

      {/* Hero: level · streak · headline stats */}
      <div className="prog-hero">
        <div className="prog-level">
          <div className="prog-level-badge">{level.level}</div>
          <div className="prog-level-body">
            <span className="prog-level-title">{level.title}</span>
            <small>Level {level.level} · {level.xp} XP</small>
            <div className="prog-xp"><i style={{ width: `${xpPct}%` }} /></div>
            <small className="prog-xp-note">{level.xpIntoLevel}/{level.xpForLevel} to level {level.level + 1}</small>
          </div>
        </div>

        <div className="prog-streak">
          <Flame size={26} className={streak.current > 0 ? "lit" : ""} />
          <strong>{streak.current}</strong>
          <span>day streak</span>
          <small>Best: {streak.longest}</small>
        </div>

        <div className="prog-kpis">
          <div className="prog-kpi"><ClipboardList size={16} /><strong>{totals.tests}</strong><span>Tests</span></div>
          <div className="prog-kpi"><TrendingUp size={16} /><strong>{totals.avgScore}%</strong><span>Avg score</span></div>
          <div className="prog-kpi"><Trophy size={16} /><strong>{totals.bestScore}%</strong><span>Best</span></div>
          <div className="prog-kpi"><Target size={16} /><strong>{totals.accuracy}%</strong><span>Accuracy</span></div>
        </div>
      </div>

      <div className="prog-grid">
        {/* Chapter completion + mastery */}
        <section className="prog-card prog-chapters">
          <h3><BookOpen size={17} /> Chapter progress</h3>
          <p className="prog-card-sub">Coverage = topics you’ve practised · Mastery = accuracy on them.</p>
          <div className="prog-ch-list">
            {chapters.map((c) => (
              <div className="prog-ch" key={c.name}>
                <div className="prog-ch-head">
                  <strong>{c.name}</strong>
                  <span>{c.topicsTested}/{c.totalTopics} topics</span>
                </div>
                <div className="prog-ch-bars">
                  <div className="prog-bar">
                    <label>Coverage</label>
                    <div className="prog-track"><i className="cov" style={{ width: `${c.coverage}%` }} /></div>
                    <b>{c.coverage}%</b>
                  </div>
                  <div className="prog-bar">
                    <label>Mastery</label>
                    <div className="prog-track"><i className={`mas band-${band(c.accuracy)}`} style={{ width: `${c.questionsAttempted ? c.accuracy : 0}%` }} /></div>
                    <b>{c.questionsAttempted ? `${c.accuracy}%` : "—"}</b>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bloom's analysis */}
        <section className="prog-card">
          <h3><Brain size={17} /> Bloom’s levels</h3>
          <p className="prog-card-sub">How you perform across cognitive skill levels.</p>
          {byBloom.length === 0 ? (
            <p className="tc-empty">Take a test to see your Bloom’s breakdown.</p>
          ) : (
            <div className="prog-bloom">
              {byBloom.map((b) => (
                <div className="prog-bloom-row" key={b.name}>
                  <span className="prog-bloom-name">{b.name}</span>
                  <div className="prog-track"><i className={`band-${band(b.accuracy)}`} style={{ width: `${b.accuracy}%` }} /></div>
                  <b>{b.accuracy}%</b>
                  <small>{b.correct}/{b.total}</small>
                </div>
              ))}
            </div>
          )}

          <h3 style={{ marginTop: "22px" }}><Zap size={17} /> By difficulty</h3>
          <div className="prog-bloom">
            {byDifficulty.map((d) => (
              <div className="prog-bloom-row" key={d.name}>
                <span className="prog-bloom-name">{d.name}</span>
                <div className="prog-track"><i className={`band-${band(d.accuracy)}`} style={{ width: `${d.accuracy}%` }} /></div>
                <b>{d.accuracy}%</b>
                <small>{d.correct}/{d.total}</small>
              </div>
            ))}
          </div>
        </section>

        {/* Recent trend */}
        <section className="prog-card">
          <h3><BarChart3 size={17} /> Recent scores</h3>
          <p className="prog-card-sub">Your last {trend.length} test{trend.length === 1 ? "" : "s"}.</p>
          <div className="prog-trend">
            {trend.map((t, i) => (
              <div className="prog-trend-col" key={i} title={`${t.title || "Test"} · ${t.score}%`}>
                <div className="prog-trend-bar-wrap">
                  <i className={`band-${band(t.score)}`} style={{ height: `${Math.max(4, (t.score / maxTrend) * 100)}%` }} />
                </div>
                <small>{t.score}</small>
              </div>
            ))}
          </div>
        </section>

        {/* Badges */}
        <section className="prog-card prog-badges-card">
          <h3><Award size={17} /> Achievements</h3>
          <p className="prog-card-sub">{badges.filter((b) => b.earned).length} of {badges.length} unlocked.</p>
          <div className="prog-badges">
            {badges.map((b) => {
              const Icon = BADGE_ICON[b.id] || Award;
              return (
                <div className={`prog-badge ${b.earned ? "earned" : "locked"}`} key={b.id} title={b.desc}>
                  <span className="prog-badge-ico">{b.earned ? <Icon size={20} /> : <Lock size={16} />}</span>
                  <strong>{b.label}</strong>
                  <small>{b.desc}</small>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
}

function ProgHeader({ navigate }) {
  return (
    <header className="tc-head">
      <GlassButton type="button" size="icon" onClick={() => navigate("/student")} aria-label="Back to portal">
        <ArrowLeft size={18} />
      </GlassButton>
      <div>
        <h1>Your Progress</h1>
        <p>Mastery, Bloom’s analysis, streaks and achievements — all from your real test performance.</p>
      </div>
    </header>
  );
}
