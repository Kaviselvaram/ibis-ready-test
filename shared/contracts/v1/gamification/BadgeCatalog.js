// Shared badge catalog (gamification #2). Definitions live here so the backend
// award engine and the frontend badge gallery stay in lockstep. Badge earning is
// backend-authorized only — this file is purely declarative.

export const RARITY = {
  common: { label: "Common", order: 1 },
  rare: { label: "Rare", order: 2 },
  epic: { label: "Epic", order: 3 },
  legendary: { label: "Legendary", order: 4 },
  mythic: { label: "Mythic", order: 5 }
};

// metric keys map to values computed by the backend BadgeService.computeStats().
export const METRICS = {
  videos: "videos",
  tests: "tests",
  easySolved: "easySolved",
  mediumSolved: "mediumSolved",
  hardSolved: "hardSolved",
  loginStreak: "loginStreak",
  studyStreak: "studyStreak",
  testStreak: "testStreak"
};

function tierFor(index, total) {
  const tiers = ["common", "common", "rare", "epic", "legendary"];
  if (total <= 1) return "rare";
  return tiers[Math.min(index, tiers.length - 1)];
}

// Milestone-badge builder.
function milestones(category, metric, thresholds, labels, icon) {
  return thresholds.map((threshold, i) => ({
    key: `${category}_${threshold}`,
    category,
    metric,
    threshold,
    icon,
    rarity: tierFor(i, thresholds.length),
    label: labels[i] || `${threshold} ${category}`,
    description: `Reach ${threshold} ${category === "video" ? "videos watched" : category === "test" ? "tests completed" : category}`
  }));
}

const videoBadges = milestones(
  "video", METRICS.videos, [1, 10, 25, 50, 100],
  ["First Video", "10 Videos", "25 Videos", "50 Videos", "100 Videos"], "play"
).map((b) => ({ ...b, description: `Watch ${b.threshold} lesson${b.threshold > 1 ? "s" : ""}` }));

const testBadges = milestones(
  "test", METRICS.tests, [1, 10, 25, 50, 100],
  ["First Test", "10 Tests", "25 Tests", "50 Tests", "100 Tests"], "clipboard"
).map((b) => ({ ...b, description: `Complete ${b.threshold} test${b.threshold > 1 ? "s" : ""}` }));

const questionBadges = [
  { key: "q_easy_100", category: "question", metric: METRICS.easySolved, threshold: 100, rarity: "rare", icon: "circle", label: "Easy Centurion", description: "Solve 100 easy questions" },
  { key: "q_medium_50", category: "question", metric: METRICS.mediumSolved, threshold: 50, rarity: "epic", icon: "triangle", label: "Medium Slayer", description: "Solve 50 medium questions" },
  { key: "q_hard_50", category: "question", metric: METRICS.hardSolved, threshold: 50, rarity: "mythic", icon: "flame", label: "Mythic Mind", description: "Solve 50 hard questions — the rarest feat" }
];

const STREAK_STEPS = [3, 7, 15, 30, 50, 100, 365];
function streakBadges(category, metric, noun, icon) {
  return STREAK_STEPS.map((threshold, i) => ({
    key: `${category}_${threshold}`,
    category,
    metric,
    threshold,
    icon,
    rarity: tierFor(Math.min(i, 4), STREAK_STEPS.length),
    label: `${threshold}-Day ${noun}`,
    description: `Maintain a ${threshold}-day ${noun.toLowerCase()} streak`
  }));
}

const loginStreak = streakBadges("streak_login", METRICS.loginStreak, "Login", "log-in");
const studyStreak = streakBadges("streak_study", METRICS.studyStreak, "Study", "book");
const testStreak = streakBadges("streak_test", METRICS.testStreak, "Test", "target");

export const BADGE_CATALOG = [
  ...videoBadges,
  ...testBadges,
  ...questionBadges,
  ...loginStreak,
  ...studyStreak,
  ...testStreak
];

export const BADGE_BY_KEY = Object.fromEntries(BADGE_CATALOG.map((b) => [b.key, b]));

export const BADGE_CATEGORIES = [
  { key: "video", label: "Video Learning" },
  { key: "test", label: "Test Completion" },
  { key: "question", label: "Question Mastery" },
  { key: "streak_login", label: "Login Streak" },
  { key: "streak_study", label: "Study Streak" },
  { key: "streak_test", label: "Test Streak" }
];
