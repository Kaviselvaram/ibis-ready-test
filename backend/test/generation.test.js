import { test } from "node:test";
import assert from "node:assert/strict";
import { GenerationService, toCounts, DEFAULT_CONFIG } from "../src/services/GenerationService.js";
const selectByDistribution = (pool, count, config) => GenerationService.selectByDistribution(pool, count, config);

const DIFF = ["Easy", "Medium", "Hard"];
const BLOOM = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];

// ---- toCounts: difficulty/Bloom % → integer counts (#7/#8) ----
test("toCounts sums to the exact total (50Q)", () => {
  const c = toCounts(DEFAULT_CONFIG.difficulty, 50, DIFF);
  assert.equal(c.Easy + c.Medium + c.Hard, 50);
});

test("toCounts sums to the exact total (100Q)", () => {
  const c = toCounts(DEFAULT_CONFIG.difficulty, 100, DIFF);
  assert.deepEqual(c, { Easy: 40, Medium: 40, Hard: 20 });
});

test("toCounts respects a custom distribution", () => {
  const c = toCounts({ Easy: 40, Medium: 40, Hard: 20 }, 10, DIFF);
  assert.deepEqual(c, { Easy: 4, Medium: 4, Hard: 2 });
});

test("toCounts never over/undershoots with awkward percentages", () => {
  const c = toCounts({ Easy: 33, Medium: 33, Hard: 34 }, 50, DIFF);
  assert.equal(c.Easy + c.Medium + c.Hard, 50);
});

test("toCounts handles a full 6-way Bloom split", () => {
  const c = toCounts(DEFAULT_CONFIG.bloom, 100, BLOOM);
  assert.equal(Object.values(c).reduce((a, b) => a + b, 0), 100);
});

// ---- selectByDistribution: dual difficulty+Bloom selection (#6 pool → #7/#8) ----
function makeBank(perDifficulty) {
  const pool = [];
  let i = 0;
  for (const d of DIFF) {
    for (let n = 0; n < perDifficulty; n++) {
      pool.push({ id: `q${i++}`, difficulty: d, bloomLevel: BLOOM[n % BLOOM.length] });
    }
  }
  return pool;
}

test("selectByDistribution returns exactly `count` unique questions", () => {
  const pool = makeBank(30); // 90 questions
  const picked = selectByDistribution(pool, 50, DEFAULT_CONFIG);
  assert.equal(picked.length, 50);
  assert.equal(new Set(picked.map((q) => q.id)).size, 50, "no duplicates");
});

test("selectByDistribution honors the difficulty quota on a rich bank", () => {
  const pool = makeBank(40); // plenty of each difficulty + bloom variety
  const picked = selectByDistribution(pool, 100, DEFAULT_CONFIG);
  const got = { Easy: 0, Medium: 0, Hard: 0 };
  picked.forEach((q) => { got[q.difficulty] += 1; });
  assert.deepEqual(got, { Easy: 40, Medium: 40, Hard: 20 });
});

test("selectByDistribution returns the whole pool when it is smaller than count", () => {
  const pool = makeBank(2); // 6 questions
  const picked = selectByDistribution(pool, 50, DEFAULT_CONFIG);
  assert.equal(picked.length, 6);
});

test("selectByDistribution still fills a full paper when Bloom variety is missing", () => {
  // Every question is 'Understand' — Bloom quota can't be met, difficulty still is.
  const pool = DIFF.flatMap((d, di) =>
    Array.from({ length: 40 }, (_, n) => ({ id: `u${di}-${n}`, difficulty: d, bloomLevel: "Understand" }))
  );
  const picked = selectByDistribution(pool, 50, DEFAULT_CONFIG);
  assert.equal(picked.length, 50);
  assert.equal(new Set(picked.map((q) => q.id)).size, 50);
});
