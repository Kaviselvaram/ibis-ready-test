import { StudentRepository } from "../repositories/StudentRepository.js";
import { CourseService } from "./CourseService.js";

// Merge per-attempt report groups (byTopic / byBloom / byDifficulty) into one
// aggregate keyed by name, summing totals and correct.
function mergeGroups(attempts, field) {
  const map = {};
  for (const a of attempts) {
    for (const g of a.report?.[field] || []) {
      const k = g.key ?? g.name ?? "Unknown";
      if (!map[k]) map[k] = { name: k, total: 0, correct: 0 };
      map[k].total += g.total || 0;
      map[k].correct += g.correct || 0;
    }
  }
  return Object.values(map).map((m) => ({
    ...m,
    accuracy: m.total ? Math.round((m.correct / m.total) * 100) : 0
  }));
}

// Consecutive-day streak (current + longest) from attempt dates.
function computeStreak(dates) {
  const days = [...new Set(dates.map((d) => new Date(d).toISOString().slice(0, 10)))].sort();
  if (!days.length) return { current: 0, longest: 0, lastActive: null };
  const toN = (s) => Math.floor(new Date(s + "T00:00:00Z").getTime() / 86400000);
  let longest = 1, run = 1;
  for (let i = 1; i < days.length; i++) {
    run = toN(days[i]) - toN(days[i - 1]) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  // Current streak counts back from the most recent active day (today or yesterday).
  const todayN = Math.floor(Date.now() / 86400000);
  const lastN = toN(days[days.length - 1]);
  let current = 0;
  if (todayN - lastN <= 1) {
    current = 1;
    for (let i = days.length - 1; i > 0; i--) {
      if (toN(days[i]) - toN(days[i - 1]) === 1) current++; else break;
    }
  }
  return { current, longest, lastActive: days[days.length - 1] };
}

function levelFrom(xp) {
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const curBase = Math.pow(level - 1, 2) * 100;
  const nextBase = Math.pow(level, 2) * 100;
  const titles = ["Rookie", "Rookie", "Learner", "Learner", "Sharp", "Sharp", "Scholar", "Scholar", "Ace", "Master"];
  return {
    level,
    xp,
    xpIntoLevel: xp - curBase,
    xpForLevel: nextBase - curBase,
    title: titles[Math.min(level - 1, titles.length - 1)] || "Master"
  };
}

export class ProgressService {
  static async getProgress(userId) {
    const [attempts, tree] = await Promise.all([
      StudentRepository.getAttemptsForProgress(userId),
      CourseService.getChapters(userId)
    ]);

    const tests = attempts.length;
    const scores = attempts.map((a) => parseFloat(a.score) || 0);
    const questionsAnswered = attempts.reduce((n, a) => n + (a.total || 0), 0);
    const correct = attempts.reduce((n, a) => n + (a.correct || 0), 0);

    const totals = {
      tests,
      avgScore: tests ? Math.round(scores.reduce((n, s) => n + s, 0) / tests) : 0,
      bestScore: tests ? Math.round(Math.max(...scores)) : 0,
      lowestScore: tests ? Math.round(Math.min(...scores)) : 0,
      testsPassed: attempts.filter((a) => (parseFloat(a.score) || 0) >= 40).length,
      questionsAnswered,
      correct,
      accuracy: questionsAnswered ? Math.round((correct / questionsAnswered) * 100) : 0
    };

    const byTopic = mergeGroups(attempts, "byTopic");
    const byBloom = mergeGroups(attempts, "byBloom");
    const byDifficulty = mergeGroups(attempts, "byDifficulty");
    const topicMap = Object.fromEntries(byTopic.map((t) => [t.name, t]));

    // Strongest / weakest topics (real, from per-topic accuracy with ≥1 attempt).
    const rankedTopics = byTopic.filter((t) => t.total > 0).sort((a, b) => b.accuracy - a.accuracy);
    const strongestTopics = rankedTopics.slice(0, 3);
    const weakestTopics = [...rankedTopics].reverse().slice(0, 3);

    // Per-chapter coverage + mastery from the course tree.
    const chapters = (tree || []).map((ch) => {
      const topics = ch.topics || [];
      let total = 0, corr = 0, tested = 0;
      for (const t of topics) {
        const s = topicMap[t.name];
        if (s && s.total > 0) { total += s.total; corr += s.correct; tested += 1; }
      }
      return {
        name: ch.name,
        totalTopics: topics.length,
        topicsTested: tested,
        coverage: topics.length ? Math.round((tested / topics.length) * 100) : 0,
        accuracy: total ? Math.round((corr / total) * 100) : 0,
        questionsAttempted: total
      };
    });

    const streak = computeStreak(attempts.map((a) => a.completed_at));
    const xp = correct * 10 + tests * 25;
    const level = levelFrom(xp);

    const trend = attempts
      .slice(0, 12)
      .reverse()
      .map((a) => ({ date: new Date(a.completed_at).toISOString().slice(0, 10), score: Math.round(parseFloat(a.score) || 0), title: a.title }));

    const chaptersAttempted = chapters.filter((c) => c.questionsAttempted > 0).length;
    const badges = [
      { id: "first_test", label: "First Steps", desc: "Complete your first test", earned: tests >= 1 },
      { id: "streak_3", label: "On a Roll", desc: "3-day practice streak", earned: streak.current >= 3 || streak.longest >= 3 },
      { id: "dedicated", label: "Dedicated", desc: "Complete 10 tests", earned: tests >= 10 },
      { id: "sharpshooter", label: "Sharpshooter", desc: "Score 90%+ on a test", earned: totals.bestScore >= 90 },
      { id: "centurion", label: "Centurion", desc: "Answer 100 questions correctly", earned: correct >= 100 },
      { id: "mock_master", label: "Mock Master", desc: "Attempt a full mock test", earned: attempts.some((a) => a.test_type === "full_syllabus") },
      { id: "explorer", label: "Explorer", desc: "Practice across 5 chapters", earned: chaptersAttempted >= 5 }
    ];

    return { totals, streak, level, chapters, byBloom, byDifficulty, byTopic, strongestTopics, weakestTopics, trend, badges };
  }
}
