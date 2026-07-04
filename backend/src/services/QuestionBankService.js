import { QuestionBankRepository } from "../repositories/QuestionBankRepository.js";
import { DIFFICULTIES } from "../../../shared/contracts/v1/question/QuestionEnums.js";
import { cached, invalidate, CACHE_KEYS } from "../utils/cache.js";
import crypto from 'crypto';

export class QuestionBankService {
  static async getBank() {
    // Read-heavy: every /test/start and /test/evaluate needs the bank.
    return cached(CACHE_KEYS.questionBank, 600, () => QuestionBankService._buildBank());
  }

  static async _buildBank() {
    try {
      const questions = await QuestionBankRepository.getBank();
      
      const revDiffMap = {
        1: DIFFICULTIES.EASY,
        2: DIFFICULTIES.MEDIUM,
        3: DIFFICULTIES.HARD
      };

      return questions.map(q => ({
        id: q.id,
        chapter: q.topics?.chapters?.title || 'Unknown Chapter',
        topic: q.topics?.title || 'Unknown Topic',
        questionType: q.question_type || 'MCQ',
        bloomLevel: q.bloom_level || 'Understand',
        difficulty: revDiffMap[q.difficulty_level] || DIFFICULTIES.MEDIUM,
        question: q.prompt,
        options: q.options || [],
        answer: (q.sealed_answers && q.sealed_answers.length > 0) ? q.sealed_answers[0].correct_option_id : 'A',
        explanation: q.explanation || 'No explanation provided.',
        source: q.source || 'Uploaded'
      }));
    } catch (e) {
      throw new Error(`QuestionBankService.getBank failed: ${e.message}`);
    }
  }

  static async saveBank(questions) {
    try {
      const topicsData = await QuestionBankRepository.getTopicsData();

      // Case-insensitive keys (#13): "Mechanics"/"mechanics" map to one chapter.
      const norm = (s) => String(s || "").trim().toLowerCase();
      const topicMap = {};
      const chapterMap = {};
      for (const t of topicsData) {
        if (t.chapters) {
          topicMap[`${norm(t.chapters.title)}:${norm(t.title)}`] = t.id;
          chapterMap[norm(t.chapters.title)] = t.chapter_id;
        }
      }

      const diffMap = {
        [DIFFICULTIES.EASY]: 1,
        [DIFFICULTIES.MEDIUM]: 2,
        [DIFFICULTIES.HARD]: 3
      };

      const questionsToUpsert = [];
      const answersToUpsert = [];

      for (const q of questions) {
        const chapterTitle = q.chapter;
        const topicTitle = q.topic;
        const cKey = norm(chapterTitle);
        const tKey = `${cKey}:${norm(topicTitle)}`;

        let chapterId = chapterMap[cKey];
        if (!chapterId) {
          chapterId = await QuestionBankRepository.upsertChapter(chapterTitle);
          chapterMap[cKey] = chapterId;
        }

        let topicId = topicMap[tKey];
        if (!topicId) {
          topicId = await QuestionBankRepository.upsertTopic(chapterId, topicTitle);
          topicMap[tKey] = topicId;
        }

        const isNew = q.id.startsWith('seed-') || q.id.startsWith('q-');
        const dbId = isNew ? crypto.randomUUID() : q.id;

        questionsToUpsert.push({
          id: dbId,
          topic_id: topicId,
          prompt: q.question,
          options: q.options,
          difficulty_level: diffMap[q.difficulty] || 2,
          // Persist Bloom + metadata so the Bloom's distribution (#8) has real data.
          bloom_level: q.bloomLevel || 'Understand',
          question_type: q.questionType || 'MCQ',
          explanation: q.explanation || null,
          source: q.source || 'Uploaded'
        });

        answersToUpsert.push({
          question_id: dbId,
          correct_option_id: q.answer || 'A'
        });
      }

      const result = await QuestionBankRepository.saveBank(questionsToUpsert, answersToUpsert);
      await invalidate(CACHE_KEYS.questionBank);
      return result;
    } catch (e) {
      throw new Error(`QuestionBankService.saveBank failed: ${e.message}`);
    }
  }
}
