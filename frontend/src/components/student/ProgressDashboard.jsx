import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Flame, Trophy, Target, TrendingUp, Award, Brain, BookOpen,
  ClipboardList, CheckCircle2, Zap, BarChart3, Gauge, Medal, ArrowUpRight, ArrowDownRight,
  Clock, Video, CalendarDays
} from "lucide-react";
import { StudentRepository } from "../../repositories/StudentRepository";
import { BadgeRepository } from "../../repositories/BadgeRepository";
import { GlassButton, Button } from "../ui/LegacyUI";
import { RadarChart, Donut, AreaTrend, RankBars, ProgressRing, Heatmap, CLAY, SAGE, GOLD, PALETTE } from "../shared/Charts";
import { BadgeStrip, BadgeGallery } from "./BadgeGallery";

const band = (n) => (n >= 75 ? "high" : n >= 45 ? "mid" : "low");

export default function ProgressDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [badges, setBadges] = useState(null);
  const [rank, setRank] = useState(null);
  const [error, setError] = useState("");
  const [galleryOpen, setGalleryOpen] = useState(false);

  useEffect(() => {
    let active = true;
    StudentRepository.getProgress()
      .then((d) => { if (active) setData(d); })
      .catch(() => { if (active) setError("Couldn’t load your progress. Please try again."); });
    // Badges + rank enrich the dashboard but never block it.
    BadgeRepository.getMine().then((b) => active && setBadges(b)).catch(() => {});
    StudentRepository.getRank().then((r) => active && setRank(r)).catch(() => {});
    return () => { active = false; };
  }, []);

  if (error) {
    return (
      <section className="pdash">
        <ProgHeader navigate={navigate} />
        <div className="prog-empty"><BarChart3 size={34} /><p>{error}</p></div>
      </section>
    );
  }
  if (!data) {
    return (
      <section className="pdash">
        <ProgHeader navigate={navigate} />
        <div className="pdash-loading"><Gauge size={26} className="spin" /><span>Loading your analytics…</span></div>
      </section>
    );
  }

  const { totals, streak, level, chapters, byBloom, byDifficulty, strongestTopics, weakestTopics, trend } = data;

  if (totals.tests === 0) {
    return (
      <section className="pdash">
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

  const xpPct = level.xpForLevel ? Math.min(100, Math.round((level.xpIntoLevel / level.xpForLevel) * 100)) : 0;
  const bloomAxes = (byBloom || []).filter((b) => b.total > 0).map((b) => ({ label: b.name, value: b.accuracy }));
  const diffSegments = (byDifficulty || []).filter((d) => d.total > 0).map((d, i) => ({
    label: d.name, value: d.total, color: [SAGE, GOLD, CLAY][i] || PALETTE[i % PALETTE.length]
  }));
  const trendSeries = (trend || []).map((t) => ({ date: t.date, count: t.score }));
  const chapterBars = (chapters || []).filter((c) => c.totalTopics > 0)
    .map((c) => ({ name: c.name, coverage: c.coverage })).sort((a, b) => b.coverage - a.coverage).slice(0, 6);

  return (
    <section className="pdash">
      <ProgHeader navigate={navigate} />

      {/* Top band: rings + level + streak + rank */}
      <div className="pdash-top">
        <div className="pdash-rings">
          <div className="pdash-ring"><ProgressRing value={totals.avgScore} label="%" color={CLAY} /><span>Avg score</span></div>
          <div className="pdash-ring"><ProgressRing value={totals.accuracy} label="%" color={SAGE} /><span>Accuracy</span></div>
          <div className="pdash-ring"><ProgressRing value={totals.bestScore} label="%" color={GOLD} /><span>Best</span></div>
        </div>

        <div className="pdash-tiles">
          <Tile icon={ClipboardList} value={totals.tests} label="Tests" />
          <Tile icon={CheckCircle2} value={totals.testsPassed} label="Passed" tone="sage" />
          <Tile icon={Brain} value={totals.correct} label="Correct" tone="gold" />
          <Tile icon={Clock} value={`${totals.learningHours ?? 0}h`} label="Learning time" />
          <Tile icon={Video} value={badges?.stats?.videos ?? 0} label="Videos" tone="sage" />
          <Tile icon={CalendarDays} value={totals.activeDays ?? 0} label="Active days" tone="gold" />
        </div>

        <div className="pdash-level-streak">
          <div className="pdash-level">
            <div className="pdash-level-badge">{level.level}</div>
            <div>
              <span className="pdash-level-title">{level.title}</span>
              <small>Level {level.level} · {level.xp} XP</small>
              <div className="prog-xp"><i style={{ width: `${xpPct}%` }} /></div>
            </div>
          </div>
          <div className="pdash-streak-rank">
            <div className="pdash-mini"><Flame size={18} className={streak.current > 0 ? "lit" : ""} /><strong>{streak.current}</strong><span>streak · best {streak.longest}</span></div>
            <div className="pdash-mini">
              <Medal size={18} />
              <strong>{rank?.rank ? `#${rank.rank}` : "—"}</strong>
              <span>{rank ? `${rank.scope === "batch" ? "batch" : "global"} rank` : "rank"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics grid — fits the viewport; only dense cards scroll internally */}
      <div className="pdash-grid">
        <Card title="Bloom's mastery" icon={Brain} sub="Accuracy by cognitive level">
          {bloomAxes.length >= 3 ? <RadarChart axes={bloomAxes} color={CLAY} /> : <Empty label="Take more tests to map your Bloom's profile" />}
        </Card>

        <Card title="Question mix" icon={Zap} sub="Questions seen by difficulty">
          {diffSegments.length ? <Donut segments={diffSegments} centerValue={diffSegments.reduce((s, d) => s + d.value, 0)} centerLabel="questions" /> : <Empty label="No graded questions yet" />}
        </Card>

        <Card title="Score trend" icon={TrendingUp} sub={`Last ${trendSeries.length} tests`}>
          {trendSeries.length ? <AreaTrend series={trendSeries} color={GOLD} /> : <Empty label="Scores will trend here" />}
        </Card>

        <Card title="Chapter coverage" icon={BookOpen} sub="Topics practised per chapter" scroll>
          {chapterBars.length ? <RankBars items={chapterBars} valueKey="coverage" labelKey="name" suffix="%" color={CLAY} /> : <Empty label="Practise a chapter to see coverage" />}
        </Card>

        <Card title="Strengths & focus" icon={Target} sub="Your best and weakest topics">
          <div className="pdash-topics">
            <div>
              <h4 className="pdash-topics-h up"><ArrowUpRight size={14} /> Strongest</h4>
              {strongestTopics?.length ? strongestTopics.map((t) => (
                <div className="pdash-topic" key={t.name}><span>{t.name}</span><b className={`band-${band(t.accuracy)}`}>{t.accuracy}%</b></div>
              )) : <Empty label="—" small />}
            </div>
            <div>
              <h4 className="pdash-topics-h down"><ArrowDownRight size={14} /> Focus on</h4>
              {weakestTopics?.length ? weakestTopics.map((t) => (
                <div className="pdash-topic" key={t.name}><span>{t.name}</span><b className={`band-${band(t.accuracy)}`}>{t.accuracy}%</b></div>
              )) : <Empty label="—" small />}
            </div>
          </div>
        </Card>

        <div className="pdash-badge-cell">
          {badges ? <BadgeStrip data={badges} onOpen={() => setGalleryOpen(true)} />
            : <Card title="Badges" icon={Award} sub="Loading…"><Empty label="Loading badges…" /></Card>}
        </div>

        <section className="pdash-card pdash-card-wide">
          <header><h3><CalendarDays size={15} /> Study consistency</h3><span>last 13 weeks · tests per day</span></header>
          <div className="pdash-card-body">
            {data.heatmap?.length ? <Heatmap days={data.heatmap} /> : <Empty label="Your daily study rhythm will appear here" />}
          </div>
        </section>
      </div>

      {galleryOpen && <BadgeGallery data={badges} onClose={() => setGalleryOpen(false)} />}
    </section>
  );
}

function Tile({ icon: Icon, value, label, tone }) {
  return (
    <div className={`pdash-tile ${tone || ""}`}>
      <Icon size={15} />
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Card({ title, icon: Icon, sub, children, scroll }) {
  return (
    <section className={`pdash-card ${scroll ? "scroll" : ""}`}>
      <header><h3><Icon size={15} /> {title}</h3>{sub && <span>{sub}</span>}</header>
      <div className="pdash-card-body">{children}</div>
    </section>
  );
}

function Empty({ label, small }) {
  return <div className={`pdash-cardempty ${small ? "small" : ""}`}>{label}</div>;
}

function ProgHeader({ navigate }) {
  return (
    <header className="pdash-header">
      <GlassButton type="button" size="icon" onClick={() => navigate("/student")} aria-label="Back to portal">
        <ArrowLeft size={18} />
      </GlassButton>
      <div>
        <h1>Your Progress</h1>
        <p>Live analytics from your real test performance — mastery, trends, streaks and badges.</p>
      </div>
    </header>
  );
}
