import { BadgeRepository } from "../repositories/BadgeRepository.js";
import { StudentRepository } from "../repositories/StudentRepository.js";
import { BADGE_CATALOG, BADGE_BY_KEY, BADGE_CATEGORIES } from "../../../shared/contracts/v1/gamification/BadgeCatalog.js";
import { AppError } from "../errors/AppError.js";

// Current consecutive-day streak ending today or yesterday, from ISO timestamps.
function currentStreak(isoDates) {
  const days = [...new Set((isoDates || []).map((d) => new Date(d).toISOString().slice(0, 10)))].sort();
  if (!days.length) return 0;
  const toN = (s) => Math.floor(new Date(s + "T00:00:00Z").getTime() / 86400000);
  const todayN = Math.floor(Date.now() / 86400000);
  const lastN = toN(days[days.length - 1]);
  if (todayN - lastN > 1) return 0; // streak broken (no activity today or yesterday)
  let streak = 1;
  for (let i = days.length - 1; i > 0; i--) {
    if (toN(days[i]) - toN(days[i - 1]) === 1) streak++; else break;
  }
  return streak;
}

export class BadgeService {
  // Aggregate the real signals every badge threshold is measured against.
  static async computeStats(userId) {
    const [videos, attempts, loginDates, studyDates] = await Promise.all([
      BadgeRepository.countEvents(userId, "video_watch"),
      StudentRepository.getAttemptsForProgress(userId),
      BadgeRepository.getEventDates(userId, ["login"]),
      BadgeRepository.getEventDates(userId, ["note_view", "video_watch"])
    ]);

    // Correct answers by difficulty, aggregated from stored attempt reports.
    let easySolved = 0, mediumSolved = 0, hardSolved = 0;
    for (const a of attempts) {
      for (const g of a.report?.byDifficulty || []) {
        const key = g.key ?? g.name;
        if (key === "Easy") easySolved += g.correct || 0;
        else if (key === "Medium") mediumSolved += g.correct || 0;
        else if (key === "Hard") hardSolved += g.correct || 0;
      }
    }

    const testDates = attempts.map((a) => a.completed_at);
    // Study activity also counts test days, so a test keeps the study streak alive.
    const studyStreak = currentStreak([...studyDates, ...testDates]);

    return {
      videos,
      tests: attempts.length,
      easySolved,
      mediumSolved,
      hardSolved,
      loginStreak: currentStreak(loginDates),
      studyStreak,
      testStreak: currentStreak(testDates)
    };
  }

  // Compute stats, auto-award any newly earned badges, and return the full
  // gallery (every catalog badge with earned flag + progress %).
  static async getForUser(userId) {
    const stats = await BadgeService.computeStats(userId);
    const earnedRows = await BadgeRepository.getEarned(userId);
    const earnedMap = new Map(earnedRows.map((r) => [r.badge_key, r]));

    const meetsThreshold = (b) => (stats[b.metric] || 0) >= b.threshold;
    const newly = BADGE_CATALOG.filter((b) => meetsThreshold(b) && !earnedMap.has(b.key)).map((b) => b.key);
    if (newly.length) {
      await BadgeRepository.award(userId, newly);
      const now = new Date().toISOString();
      newly.forEach((k) => earnedMap.set(k, { badge_key: k, earned_at: now, granted_by: null }));
    }

    const badges = BADGE_CATALOG.map((b) => {
      const row = earnedMap.get(b.key);
      const value = stats[b.metric] || 0;
      return {
        ...b,
        earned: !!row,
        earnedAt: row?.earned_at || null,
        manual: !!row?.granted_by,
        value,
        progress: Math.min(100, Math.round((value / b.threshold) * 100))
      };
    });

    return {
      stats,
      categories: BADGE_CATEGORIES,
      earnedCount: badges.filter((b) => b.earned).length,
      total: badges.length,
      newlyAwarded: newly,
      badges
    };
  }

  // ---- Admin badge management (backend-authorized only) ----
  static async grant(profileId, badgeKey, adminId) {
    if (!BADGE_BY_KEY[badgeKey]) throw new AppError("Unknown badge", 400, "BAD_INPUT");
    await BadgeRepository.award(profileId, [badgeKey], adminId);
    return { ok: true, badge_key: badgeKey };
  }

  static async revoke(profileId, badgeKey) {
    await BadgeRepository.revoke(profileId, badgeKey);
    return { ok: true, badge_key: badgeKey };
  }

  static getCatalog() {
    return { categories: BADGE_CATEGORIES, badges: BADGE_CATALOG };
  }
}
