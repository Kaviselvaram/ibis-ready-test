import crypto from "crypto";
import { SettingsRepository } from "../repositories/SettingsRepository.js";
import { DIFFICULTIES, BLOOM_LEVELS } from "../../../shared/contracts/v1/question/QuestionEnums.js";

const SETTINGS_KEY = "generation_config";

// Admin-configurable defaults (matches the seeded row). Percentages per axis.
export const DEFAULT_CONFIG = {
  difficulty: { Easy: 40, Medium: 40, Hard: 20 },
  bloom: { Remember: 15, Understand: 20, Apply: 25, Analyze: 20, Evaluate: 12, Create: 8 }
};

const DIFF_LABELS = Object.values(DIFFICULTIES);   // Easy, Medium, Hard
const BLOOM_LABELS = Object.values(BLOOM_LEVELS);  // Remember … Create

// Cryptographically secure Fisher-Yates shuffle.
export const secureShuffle = (arr) => {
  const r = [...arr];
  for (let i = r.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

// Convert a {label: percent} distribution into integer counts summing exactly to
// `total`, using the largest-remainder method so rounding never over/undershoots.
export function toCounts(distribution, total, labels) {
  const keys = labels.filter((k) => (distribution[k] || 0) > 0);
  const sumPct = keys.reduce((s, k) => s + distribution[k], 0) || 1;
  const raw = keys.map((k) => ({ k, exact: (distribution[k] / sumPct) * total }));
  const counts = {};
  let assigned = 0;
  raw.forEach((r) => { counts[r.k] = Math.floor(r.exact); assigned += counts[r.k]; });
  // Distribute the remainder to the largest fractional parts.
  const remainder = total - assigned;
  raw.sort((a, b) => (b.exact - Math.floor(b.exact)) - (a.exact - Math.floor(a.exact)));
  for (let i = 0; i < remainder; i++) counts[raw[i % raw.length].k] += 1;
  return counts;
}

function normDiff(q) {
  return DIFF_LABELS.includes(q.difficulty) ? q.difficulty : "Medium";
}
function normBloom(q) {
  return BLOOM_LABELS.includes(q.bloomLevel) ? q.bloomLevel : "Understand";
}

export class GenerationService {
  static async getConfig() {
    const stored = await SettingsRepository.get(SETTINGS_KEY);
    return {
      difficulty: { ...DEFAULT_CONFIG.difficulty, ...(stored?.difficulty || {}) },
      bloom: { ...DEFAULT_CONFIG.bloom, ...(stored?.bloom || {}) }
    };
  }

  static async updateConfig(patch) {
    const current = await GenerationService.getConfig();
    const clean = (obj, labels, src) => {
      const out = { ...obj };
      if (src && typeof src === "object") {
        for (const k of labels) {
          if (src[k] !== undefined) {
            const n = Number(src[k]);
            if (!Number.isFinite(n) || n < 0 || n > 100) {
              const err = new Error(`Invalid percentage for ${k}`);
              err.statusCode = 400;
              throw err;
            }
            out[k] = n;
          }
        }
      }
      return out;
    };
    const next = {
      difficulty: clean(current.difficulty, DIFF_LABELS, patch.difficulty),
      bloom: clean(current.bloom, BLOOM_LABELS, patch.bloom)
    };
    await SettingsRepository.set(SETTINGS_KEY, next);
    return next;
  }

  /**
   * Select `count` questions from `pool` honoring BOTH the difficulty and Bloom
   * distributions simultaneously (#7 + #8). Greedy with graceful relaxation so a
   * bank that can't satisfy the ideal split still returns a full paper:
   *   1. pick questions that still have quota in their difficulty AND their bloom
   *   2. relax to difficulty-quota only
   *   3. fill any shortfall from whatever remains
   */
  static selectByDistribution(pool, count, config) {
    const target = Math.min(count, pool.length);
    if (pool.length <= target) return secureShuffle(pool);

    const diffQuota = toCounts(config.difficulty, target, DIFF_LABELS);
    const bloomQuota = toCounts(config.bloom, target, BLOOM_LABELS);

    const shuffled = secureShuffle(pool);
    const picked = [];
    const usedIds = new Set();

    const takeIf = (predicate) => {
      for (const q of shuffled) {
        if (picked.length >= target) break;
        if (usedIds.has(q.id)) continue;
        if (predicate(q)) {
          const d = normDiff(q), b = normBloom(q);
          picked.push(q);
          usedIds.add(q.id);
          diffQuota[d] = (diffQuota[d] || 0) - 1;
          bloomQuota[b] = (bloomQuota[b] || 0) - 1;
        }
      }
    };

    // Pass 1: satisfy both axes.
    takeIf((q) => (diffQuota[normDiff(q)] || 0) > 0 && (bloomQuota[normBloom(q)] || 0) > 0);
    // Pass 2: satisfy difficulty only (bank may lack Bloom variety).
    if (picked.length < target) takeIf((q) => (diffQuota[normDiff(q)] || 0) > 0);
    // Pass 3: fill remainder with anything left.
    if (picked.length < target) takeIf(() => true);

    return secureShuffle(picked).slice(0, target);
  }
}
