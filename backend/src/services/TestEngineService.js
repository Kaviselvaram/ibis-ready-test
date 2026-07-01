import crypto from "crypto";
import { PaymentRepository } from "../repositories/PaymentRepository.js";
import { TestRepository } from "../repositories/TestRepository.js";
import { getRedisClient } from "../config/redis.js";
import { AppError } from "../errors/AppError.js";
import { QuestionBankService } from "./QuestionBankService.js";
import { DIFFICULTIES } from "../../../shared/contracts/v1/question/QuestionEnums.js";
import { invalidate, CACHE_KEYS } from "../utils/cache.js";

// Cryptographically secure Fisher-Yates shuffle
const secureShuffleArray = (arr) => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const startAttempt = async (userId, chapterId, topicId) => {
  const redis = getRedisClient();
  const { data: sub } = await PaymentRepository.getActiveSubscription(userId);
  if (!sub || new Date(sub.valid_until) < new Date()) {
    throw new AppError("Active Pro subscription required to start a test", 403, "PAYMENT_REQUIRED");
  }

  const { data: questions, error } = topicId 
    ? await TestRepository.getQuestionsByTopic(topicId) 
    : await TestRepository.getQuestionsByChapter(chapterId);
  
  if (error || !questions || questions.length === 0) {
    throw new AppError("No questions found for this topic", 404, "NOT_FOUND");
  }

  const shuffledQuestions = secureShuffleArray(questions);
  const shuffleMap = {}; 
  const clientQuestions = [];

  for (const q of shuffledQuestions) {
    const optionObjs = q.options.map((opt, idx) => typeof opt === 'string' ? { id: idx.toString(), text: opt } : opt);
    const shuffledOptions = secureShuffleArray(optionObjs);
    
    shuffleMap[q.id] = shuffledOptions.map(o => o.id);
    
    clientQuestions.push({
      id: q.id,
      prompt: q.prompt,
      options: shuffledOptions,
      difficulty: q.difficulty_level
    });
  }

  const attemptId = crypto.randomUUID();
  
  if (redis) {
    const redisKey = `shuffle:${userId}:${attemptId}`;
    await redis.setex(redisKey, 7200, JSON.stringify(shuffleMap));
    await redis.setex(`attempt_start:${attemptId}`, 7200, Date.now().toString());
  }

  return { attemptId, questions: clientQuestions };
};

export const submitAttempt = async (userId, attemptId, answers) => {
  if (!userId || !attemptId || !answers) {
    throw new AppError("Missing parameters", 400, "BAD_INPUT");
  }

  // REMEDIATION 2 — Part A: Redis atomic lock
  const redis = getRedisClient();
  const lockKey = `submitting:${userId}:${attemptId}`;
  const lockToken = crypto.randomUUID();

  if (redis) {
    const locked = await redis.set(lockKey, lockToken, "NX", "EX", 30);
    if (!locked) {
      throw new AppError("Submission already in progress", 409, "SUBMISSION_IN_PROGRESS");
    }
  }

  try {

    const attemptStartStr = await redis?.get(`attempt_start:${attemptId}`);
    if (!attemptStartStr) throw new AppError("Attempt expired or invalid", 400, "ATTEMPT_EXPIRED");
    
    const timeTakenMs = Date.now() - parseInt(attemptStartStr, 10);
    const timeLimitMs = 3600000; // 1 hour

    if (timeTakenMs > (timeLimitMs + 30000)) {
      throw new AppError("Time expired", 400, "TIME_EXPIRED");
    }

    const redisKey = `shuffle:${userId}:${attemptId}`;
    const mapStr = await redis?.get(redisKey);
    if (!mapStr) throw new AppError("Attempt not found or does not belong to you", 403, "ATTEMPT_FORBIDDEN");
    const shuffleMap = JSON.parse(mapStr);

    const questionIds = Object.keys(shuffleMap);
    const { data: sealedAnswers } = await TestRepository.getSealedAnswers(questionIds);
    
    const answerMap = {};
    sealedAnswers.forEach(sa => answerMap[sa.question_id] = sa.correct_option_id);

    let correctCount = 0;
    const total = questionIds.length;

    for (const { questionId, selectedId } of answers) {
      if (!shuffleMap[questionId]?.includes(selectedId.toString())) {
        throw new AppError("Invalid option submitted", 400, "BAD_INPUT");
      }

      const isCorrect = (selectedId.toString() === answerMap[questionId]);
      if (isCorrect) correctCount++;
    }

    const score = (correctCount / total) * 100;
    
    // REMEDIATION 2 — Part B: DB-level guard
    const { data: updateData, error: updateError } = await TestRepository.markAttemptSubmitted(attemptId, userId);

    if (updateError) throw new AppError("Failed to update attempt", 500, "DB_ERROR");
    if (!updateData?.length) {
      throw new AppError('Attempt already submitted', 409, 'ALREADY_SUBMITTED');
    }

    const { error } = await TestRepository.saveTestResult(attemptId, score, total, timeTakenMs, score >= 40);

    if (error) throw new AppError("Failed to save attempt results", 500, "DB_ERROR");

    if (redis) {
      await redis.del(`shuffle:${userId}:${attemptId}`);
      await redis.del(`attempt_start:${attemptId}`);
    }

    return { score, total, passed: score >= 40, time_taken: Math.floor(timeTakenMs / 1000) };
  } finally {
    // REMEDIATION 2 — Part C: Safe lock release
    if (redis) {
      const currentLock = await redis.get(lockKey);
      if (currentLock === lockToken) {
        await redis.del(lockKey);
      }
    }
  }
};

export class TestEngineService {
  static async generateTest({ chapter, topic, count }) {
    const bank = await QuestionBankService.getBank();
    let pool = bank;
    if (chapter) pool = pool.filter((q) => q.chapter === chapter);
    if (topic) pool = pool.filter((q) => q.topic === topic);

    if (pool.length <= count) return secureShuffleArray(pool);

    const buckets = { Easy: [], Medium: [], Hard: [] };
    pool.forEach((q) => {
      const diffLabel = Object.keys(DIFFICULTIES).find(k => DIFFICULTIES[k] === q.difficulty) || 'Medium';
      (buckets[diffLabel] || (buckets[diffLabel] = [])).push(q);
    });
    Object.keys(buckets).forEach((k) => (buckets[k] = secureShuffleArray(buckets[k])));

    const targets = {
      Easy: Math.round(count * 0.3),
      Medium: Math.round(count * 0.45),
    };
    targets.Hard = count - targets.Easy - targets.Medium;

    let picked = [];
    ["Easy", "Medium", "Hard"].forEach((level) => {
      picked.push(...(buckets[level] || []).slice(0, Math.max(0, targets[level])));
    });

    if (picked.length < count) {
      const chosen = new Set(picked.map((q) => q.id));
      const remaining = secureShuffleArray(pool.filter((q) => !chosen.has(q.id)));
      picked.push(...remaining.slice(0, count - picked.length));
    }

    // Strip answers before sending to client
    const testQuestions = secureShuffleArray(picked).slice(0, count).map(q => {
      const { answer, explanation, ...safeQ } = q;
      return safeQ;
    });
    
    return testQuestions;
  }

  static async evaluateTest({ questions, answers, meta }, userId = null) {
    const bank = await QuestionBankService.getBank();
    const bankMap = new Map(bank.map(q => [q.id, q]));

    const graded = questions.map((q) => {
      const fullQ = bankMap.get(q.id) || q;
      const given = answers[q.id] || null;
      return { q: fullQ, given, correct: given === fullQ.answer };
    });

    const total = graded.length;
    const correct = graded.filter((g) => g.correct).length;
    const wrong = graded.filter((g) => g.given && !g.correct).length;
    const skipped = graded.filter((g) => !g.given).length;
    const accuracy = total ? Math.round((correct / total) * 100) : 0;

    const groupStats = (gradedList, keyFn) => {
      const map = {};
      gradedList.forEach((g) => {
        const key = keyFn(g);
        if (!map[key]) map[key] = { key, total: 0, correct: 0 };
        map[key].total += 1;
        if (g.correct) map[key].correct += 1;
      });
      return Object.values(map).map((s) => ({
        ...s,
        accuracy: s.total ? Math.round((s.correct / s.total) * 100) : 0,
      }));
    };

    const byDifficulty = Object.values(DIFFICULTIES).map(
      (d) => groupStats(graded.filter((g) => g.q.difficulty === d), () => d)[0]
    ).filter(Boolean);
    
    const byBloom = groupStats(graded, (g) => g.q.bloomLevel);
    const byTopic = groupStats(graded, (g) => g.q.topic);

    const ranked = [...byTopic].sort((a, b) => b.accuracy - a.accuracy);
    const strongest = ranked[0] || null;
    const weakest = ranked.length > 1 ? ranked[ranked.length - 1] : null;

    let verdict = "Keep practising";
    if (accuracy >= 85) verdict = "Excellent";
    else if (accuracy >= 70) verdict = "Strong";
    else if (accuracy >= 50) verdict = "Developing";

    // Genuine, data-derived strengths & focus areas (per-topic accuracy).
    const rankedTopics = [...byTopic].filter((t) => t.total > 0);
    const strengths = rankedTopics.filter((t) => t.accuracy >= 70).sort((a, b) => b.accuracy - a.accuracy);
    const focusAreas = rankedTopics.filter((t) => t.accuracy < 50).sort((a, b) => a.accuracy - b.accuracy);

    const report = {
      meta,
      total,
      correct,
      wrong,
      skipped,
      accuracy,
      verdict,
      byDifficulty,
      byBloom,
      byTopic,
      strengths,
      focusAreas,
      strongest,
      weakest,
      graded,
    };

    // Persist the full attempt (report included) so it feeds progress, the
    // leaderboard, and the student/admin history views. Best-effort: a storage
    // hiccup must never block the student's report.
    let attemptId = null;
    if (userId) {
      try {
        const { data } = await TestRepository.recordAttempt({
          profileId: userId,
          topicId: null,
          testId: meta?.testId || null,
          title: meta?.label || "Test",
          testType: meta?.mode || null,
          score: accuracy,
          total, correct, wrong, skipped,
          timeTakenSeconds: meta?.timeTakenSec || 0,
          report
        });
        attemptId = data?.id || null;
        await invalidate(CACHE_KEYS.leaderboard);
      } catch (e) {
        console.error("Could not record test attempt (non-fatal):", e.message);
      }
    }

    return { ...report, attemptId };
  }

  // ---- Test history + single result (student owns theirs; admin sees any) ----
  static async getHistory(profileId) {
    const { data, error } = await TestRepository.getHistory(profileId);
    if (error) throw new AppError(error.message, 500, "DB_ERROR");
    return data || [];
  }

  static async getResult(id, requester) {
    const { data, error } = await TestRepository.getResult(id);
    if (error) throw new AppError(error.message, 500, "DB_ERROR");
    if (!data) throw new AppError("Result not found", 404, "NOT_FOUND");
    const isOwner = data.profile_id === requester.sub;
    const isAdmin = requester.role === "admin";
    if (!isOwner && !isAdmin) throw new AppError("You cannot view this result", 403, "FORBIDDEN");
    return {
      id: data.id,
      title: data.title,
      test_type: data.test_type,
      completed_at: data.completed_at,
      report: data.report
    };
  }

  static async getStudentInfo(profileId) {
    const { data } = await TestRepository.getProfileBasic(profileId);
    return data ? { id: data.id, name: data.full_name || data.email, email: data.email } : null;
  }

  // ---- Admin test management ----
  static async listTests() {
    const { data, error } = await TestRepository.listAllTests();
    if (error) throw new AppError(error.message, 500, "DB_ERROR");
    return data || [];
  }

  static async createTest(payload) {
    const { data, error } = await TestRepository.createTest(payload);
    if (error) throw new AppError(error.message, 400, "DB_ERROR");
    return data;
  }

  static async updateTest(id, patch) {
    const { data, error } = await TestRepository.updateTest(id, patch);
    if (error) throw new AppError(error.message, 400, "DB_ERROR");
    return data;
  }

  static async deleteTest(id) {
    const { error } = await TestRepository.deleteTest(id);
    if (error) throw new AppError(error.message, 400, "DB_ERROR");
    return { id };
  }

  // ---- Student: browse live tests + start an attempt ----
  static async listAvailableTests() {
    const { data, error } = await TestRepository.listLiveTests();
    if (error) throw new AppError(error.message, 500, "DB_ERROR");
    return data || [];
  }

  // Build a ready-to-take test (answers stripped) from a live test config.
  static async startTest(testId) {
    const { data: test, error } = await TestRepository.getTestById(testId);
    if (error || !test) throw new AppError("Test not found", 404, "NOT_FOUND");
    if (!test.is_live) throw new AppError("This test is not currently available", 403, "FORBIDDEN");

    // Map the config's chapter ids to their titles (the bank is keyed by name).
    let chapterNames = [];
    if (test.chapter_ids?.length) {
      const { data: chs } = await TestRepository.getChaptersByIds(test.chapter_ids);
      chapterNames = (chs || []).map((c) => c.title);
    }

    const bank = await QuestionBankService.getBank();
    let pool = chapterNames.length
      ? bank.filter((q) => chapterNames.includes(q.chapter))
      : bank;

    if (!pool.length) throw new AppError("No questions available for this test yet", 409, "NO_QUESTIONS");

    const count = Math.min(test.question_count, pool.length);
    const questions = secureShuffleArray(pool).slice(0, count).map((q) => {
      const { answer, explanation, ...safe } = q;
      return safe;
    });

    return {
      test: {
        id: test.id,
        title: test.title,
        test_type: test.test_type,
        duration_minutes: test.duration_minutes,
        question_count: count
      },
      questions
    };
  }
}
