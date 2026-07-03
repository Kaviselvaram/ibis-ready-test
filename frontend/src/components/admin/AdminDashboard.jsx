import React, { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  BookOpen, Layers, Users, ClipboardList, Radio, ArrowRight, HelpCircle,
  RefreshCw, Video, FileText, GraduationCap, TrendingUp, Activity,
  UserCheck, Trophy, AlertCircle, Sparkles
} from "lucide-react";
import { AnalyticsRepository } from "../../repositories/AnalyticsRepository";
import { useAuthenticationController } from "../../hooks/useAuthenticationController";
import { friendlyMessage } from "../../contexts/ToastContext";
import { AreaTrend, BarSeries, Donut, RankBars, CLAY, GOLD, SAGE, PALETTE } from "./DashboardCharts";

function Kpi({ icon: Icon, label, value, sub, to, tone }) {
  const body = (
    <>
      <span className={`kpi-icon ${tone || ""}`}><Icon size={17} /></span>
      <div className="kpi-body">
        <strong>{value}</strong>
        <span>{label}</span>
        {sub && <small>{sub}</small>}
      </div>
      {to && <ArrowRight size={15} className="kpi-arrow" />}
    </>
  );
  return to ? <NavLink to={to} className="kpi-card">{body}</NavLink> : <div className="kpi-card">{body}</div>;
}

function Panel({ title, kicker, children, wide }) {
  return (
    <section className={`dash-panel ${wide ? "wide" : ""}`}>
      <header className="dash-panel-head">
        <h3>{title}</h3>
        {kicker && <span>{kicker}</span>}
      </header>
      <div className="dash-panel-body">{children}</div>
    </section>
  );
}

function EmptyChart({ label }) {
  return <div className="chart-empty"><Activity size={20} /><span>{label}</span></div>;
}

export default function AdminDashboard() {
  const { user } = useAuthenticationController();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (force) => {
    if (force) setRefreshing(true); else setStatus("loading");
    try {
      const res = await AnalyticsRepository.getAnalytics(force);
      setData(res);
      setStatus("ready");
      setError("");
    } catch (e) {
      setError(friendlyMessage(e, "Couldn’t load analytics right now."));
      if (!data) setStatus("error");
    } finally {
      setRefreshing(false);
    }
  }, [data]);

  // Fetch once on mount only — no polling. New data arrives only on Refresh.
  useEffect(() => { load(false); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const k = data?.kpis;
  const generated = data?.generatedAt ? new Date(data.generatedAt) : null;

  const hasEngagement = (data?.engagementByDay || []).some((d) => d.count > 0);
  const hasAttempts = (data?.attemptsByDay || []).some((d) => d.count > 0);
  const hasSignups = (data?.signupsByDay || []).some((d) => d.count > 0);
  const hasScores = (data?.scoreDistribution || []).some((d) => d.count > 0);

  return (
    <div className="adminx-page dash-analytics">
      <header className="adminx-pagehead dash-head">
        <div>
          <h1>Welcome back, {user?.name || "Admin"}</h1>
          <p>
            Live platform analytics, aggregated from the database.
            {generated && <> Last updated {generated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}.</>}
          </p>
        </div>
        <button className={`dash-refresh ${refreshing ? "busy" : ""}`} onClick={() => load(true)} disabled={refreshing || status === "loading"}>
          <RefreshCw size={15} className={refreshing ? "spin" : ""} /> {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {error && status === "ready" && (
        <div className="dash-inline-error"><AlertCircle size={15} /> {error}</div>
      )}

      {status === "loading" && (
        <div className="dash-loading">
          <RefreshCw size={22} className="spin" />
          <span>Crunching the latest numbers…</span>
        </div>
      )}

      {status === "error" && (
        <div className="dash-error-state">
          <AlertCircle size={30} />
          <h3>Analytics unavailable</h3>
          <p>{error}</p>
          <button className="dash-refresh" onClick={() => load(true)}><RefreshCw size={15} /> Try again</button>
        </div>
      )}

      {status === "ready" && k && (
        <>
          <div className="kpi-grid">
            <Kpi icon={Users} label="Students" value={k.students} sub={`${k.activeStudents7d} active this week`} to="/admin/students" tone="clay" />
            <Kpi icon={UserCheck} label="Paid students" value={k.paidStudents} sub={`${k.trialStudents} on trial`} tone="sage" />
            <Kpi icon={BookOpen} label="Chapters" value={k.chapters} sub={`${k.publishedChapters} published`} to="/admin/content" tone="gold" />
            <Kpi icon={Layers} label="Topics" value={k.topics} to="/admin/content" />
            <Kpi icon={Video} label="Videos" value={k.videos} to="/admin/content" />
            <Kpi icon={FileText} label="Note PDFs" value={k.notes} to="/admin/content" />
            <Kpi icon={HelpCircle} label="Questions" value={k.questions} to="/admin/tests/bank" />
            <Kpi icon={ClipboardList} label="Tests" value={k.tests} sub={`${k.liveTests} live`} to="/admin/tests" />
            <Kpi icon={GraduationCap} label="Batches" value={k.batches} to="/admin/batches" />
            <Kpi icon={TrendingUp} label={`Avg score · ${data.windowDays}d`} value={`${k.avgScore}%`} sub={`${k.attemptsWindow} attempts`} tone="clay" />
          </div>

          <div className="dash-panels">
            <Panel title="Student signups" kicker={`last ${data.windowDays} days`}>
              {hasSignups ? <AreaTrend series={data.signupsByDay} color={CLAY} /> : <EmptyChart label="No new signups in this window yet" />}
            </Panel>

            <Panel title="Tests taken" kicker={`last ${data.windowDays} days`}>
              {hasAttempts ? <AreaTrend series={data.attemptsByDay} color={SAGE} /> : <EmptyChart label="No test attempts in this window yet" />}
            </Panel>

            <Panel title="Average score trend" kicker={`last ${data.windowDays} days`}>
              {hasAttempts ? <AreaTrend series={data.scoreTrend} color={GOLD} /> : <EmptyChart label="Scores will chart once tests are taken" />}
            </Panel>

            <Panel title="Score distribution" kicker="all attempts in window">
              {hasScores ? <BarSeries data={data.scoreDistribution} color={GOLD} /> : <EmptyChart label="No graded attempts yet" />}
            </Panel>

            <Panel title="Content engagement" kicker={`last ${data.windowDays} days`}>
              {hasEngagement ? (
                <Donut
                  segments={data.eventsByType.map((e, i) => ({
                    label: e.type.replace(/_/g, " "),
                    value: e.count,
                    color: PALETTE[i % PALETTE.length]
                  }))}
                  centerValue={data.engagementByDay.reduce((s, d) => s + d.count, 0)}
                  centerLabel="views"
                />
              ) : (
                <EmptyChart label="Engagement appears as students open notes & videos" />
              )}
            </Panel>

            <Panel title="Access mix" kicker="paid vs trial">
              <Donut
                segments={[
                  { label: "Paid", value: k.paidStudents, color: SAGE },
                  { label: "Trial", value: k.trialStudents, color: GOLD }
                ]}
                centerValue={k.students}
                centerLabel="students"
              />
            </Panel>

            <Panel title="Most-opened chapters" kicker="by content views" wide>
              {data.topChapters.length ? (
                <RankBars items={data.topChapters} valueKey="views" labelKey="name" color={CLAY} />
              ) : (
                <EmptyChart label="Chapter engagement will rank here as students study" />
              )}
            </Panel>

            <Panel title="Batch performance" kicker="avg score by batch" wide>
              {data.batchPerformance.length ? (
                <RankBars items={data.batchPerformance} valueKey="avgScore" labelKey="name" suffix="%" color={SAGE} />
              ) : (
                <EmptyChart label="Create batches and record attempts to compare" />
              )}
            </Panel>
          </div>

          <div className="dash-links">
            <NavLink to="/admin/content" className="dash-link">
              <BookOpen size={20} />
              <div><strong>Manage content</strong><span>Chapters, topics, videos & notes</span></div>
              <ArrowRight size={16} />
            </NavLink>
            <NavLink to="/admin/tests" className="dash-link">
              <ClipboardList size={20} />
              <div><strong>Build tests</strong><span>Create & publish tests, edit the question bank</span></div>
              <ArrowRight size={16} />
            </NavLink>
            <NavLink to="/admin/students" className="dash-link">
              <Users size={20} />
              <div><strong>Students</strong><span>View enrolments & manage access</span></div>
              <ArrowRight size={16} />
            </NavLink>
          </div>
        </>
      )}
    </div>
  );
}
