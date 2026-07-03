import { AnalyticsRepository } from "../repositories/AnalyticsRepository.js";
import { cached, invalidate } from "../utils/cache.js";

const ANALYTICS_KEY = "admin:analytics";
const WINDOW_DAYS = 30;

function dayKey(d) {
  return new Date(d).toISOString().slice(0, 10); // YYYY-MM-DD
}

// Build a zero-filled [{ date, count }] series across the last `days` days.
function emptySeries(days) {
  const out = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    out.push({ date: dayKey(d), count: 0 });
  }
  return out;
}

function seriesFrom(rows, tsField, days) {
  const series = emptySeries(days);
  const index = new Map(series.map((s, i) => [s.date, i]));
  for (const r of rows) {
    const k = dayKey(r[tsField]);
    if (index.has(k)) series[index.get(k)].count += 1;
  }
  return series;
}

export class AnalyticsService {
  // Cached briefly so a rapid double-press of Refresh doesn't double-hit the DB,
  // but short enough that Refresh always feels live. Force=true bypasses cache.
  static async getAnalytics({ force = false } = {}) {
    if (force) await invalidate(ANALYTICS_KEY);
    return cached(ANALYTICS_KEY, 30, () => AnalyticsService._compute());
  }

  static async _compute() {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - WINDOW_DAYS);
    const sinceIso = since.toISOString();
    const since7 = new Date();
    since7.setUTCDate(since7.getUTCDate() - 7);

    const [counts, profiles, attempts, events, chapterTitles, batches] = await Promise.all([
      AnalyticsRepository.getCounts(),
      AnalyticsRepository.getProfiles(),
      AnalyticsRepository.getAttempts(sinceIso),
      AnalyticsRepository.getEvents(sinceIso),
      AnalyticsRepository.getChapterTitles(),
      AnalyticsRepository.getBatches()
    ]);

    // ---- Score aggregates ----
    const scores = attempts.map((a) => Number(a.score) || 0);
    const avgScore = scores.length ? Math.round(scores.reduce((s, n) => s + n, 0) / scores.length) : 0;

    const buckets = [
      { label: "0–40", min: 0, max: 40, count: 0 },
      { label: "40–60", min: 40, max: 60, count: 0 },
      { label: "60–75", min: 60, max: 75, count: 0 },
      { label: "75–90", min: 75, max: 90, count: 0 },
      { label: "90–100", min: 90, max: 101, count: 0 }
    ];
    for (const s of scores) {
      const b = buckets.find((x) => s >= x.min && s < x.max) || buckets[buckets.length - 1];
      b.count += 1;
    }

    // ---- Time series ----
    const signupsByDay = seriesFrom(profiles, "created_at", WINDOW_DAYS);
    const attemptsByDay = seriesFrom(attempts, "completed_at", WINDOW_DAYS);
    const engagementByDay = seriesFrom(events, "created_at", WINDOW_DAYS);

    // Avg score per day (only days with attempts get a point).
    const scoreByDay = new Map();
    for (const a of attempts) {
      const k = dayKey(a.completed_at);
      if (!scoreByDay.has(k)) scoreByDay.set(k, []);
      scoreByDay.get(k).push(Number(a.score) || 0);
    }
    const scoreTrend = emptySeries(WINDOW_DAYS).map((s) => ({
      date: s.date,
      count: scoreByDay.has(s.date)
        ? Math.round(scoreByDay.get(s.date).reduce((x, n) => x + n, 0) / scoreByDay.get(s.date).length)
        : null
    }));

    // ---- Engagement by type ----
    const typeMap = new Map();
    for (const e of events) typeMap.set(e.event_type, (typeMap.get(e.event_type) || 0) + 1);
    const eventsByType = [...typeMap.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);

    // ---- Top chapters by engagement views ----
    const titleById = new Map(chapterTitles.map((c) => [c.id, c.title]));
    const chapViews = new Map();
    for (const e of events) {
      if (!e.chapter_id) continue;
      chapViews.set(e.chapter_id, (chapViews.get(e.chapter_id) || 0) + 1);
    }
    const topChapters = [...chapViews.entries()]
      .map(([id, views]) => ({ name: titleById.get(id) || "Unknown", views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 6);

    // ---- Active students (distinct with an attempt or event in last 7 days) ----
    const active7 = new Set();
    for (const a of attempts) if (new Date(a.completed_at) >= since7 && a.profile_id) active7.add(a.profile_id);
    for (const e of events) if (new Date(e.created_at) >= since7 && e.profile_id) active7.add(e.profile_id);

    // ---- Batch performance ----
    const attemptsByProfile = new Map();
    for (const a of attempts) {
      if (!a.profile_id) continue;
      if (!attemptsByProfile.has(a.profile_id)) attemptsByProfile.set(a.profile_id, []);
      attemptsByProfile.get(a.profile_id).push(Number(a.score) || 0);
    }
    const profileBatch = new Map(profiles.map((p) => [p.id, p.batch_id]));
    const batchAgg = new Map(batches.map((b) => [b.id, { name: b.name || b.code, students: 0, scoreSum: 0, scoreN: 0 }]));
    for (const p of profiles) {
      if (!p.batch_id || !batchAgg.has(p.batch_id)) continue;
      batchAgg.get(p.batch_id).students += 1;
    }
    for (const [pid, arr] of attemptsByProfile.entries()) {
      const bid = profileBatch.get(pid);
      if (!bid || !batchAgg.has(bid)) continue;
      const agg = batchAgg.get(bid);
      agg.scoreSum += arr.reduce((x, n) => x + n, 0);
      agg.scoreN += arr.length;
    }
    const batchPerformance = [...batchAgg.values()]
      .filter((b) => b.students > 0)
      .map((b) => ({ name: b.name, students: b.students, avgScore: b.scoreN ? Math.round(b.scoreSum / b.scoreN) : 0 }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 6);

    const trialStudents = Math.max(0, counts.students - counts.activeSubs);

    return {
      generatedAt: new Date().toISOString(),
      windowDays: WINDOW_DAYS,
      kpis: {
        students: counts.students,
        activeStudents7d: active7.size,
        paidStudents: counts.activeSubs,
        trialStudents,
        chapters: counts.chapters,
        publishedChapters: counts.publishedChapters,
        topics: counts.topics,
        videos: counts.videos,
        notes: counts.notes,
        questions: counts.questions,
        tests: counts.tests,
        liveTests: counts.liveTests,
        batches: counts.batches,
        attemptsWindow: attempts.length,
        avgScore
      },
      signupsByDay,
      attemptsByDay,
      engagementByDay,
      scoreTrend,
      scoreDistribution: buckets.map((b) => ({ label: b.label, count: b.count })),
      eventsByType,
      topChapters,
      batchPerformance
    };
  }

  // Best-effort engagement logging — a failure here must never break the
  // student action that triggered it (fire-and-forget at the controller).
  static async logEvent(payload) {
    return AnalyticsRepository.logEvent(payload);
  }
}
