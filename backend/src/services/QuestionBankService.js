import { QuestionBankRepository } from "../repositories/QuestionBankRepository.js";
import { DIFFICULTIES } from "../../../shared/contracts/v1/question/QuestionEnums.js";
import crypto from 'crypto';

export class QuestionBankService {
  static async getBank() {
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
      
      const topicMap = {};
      const chapterMap = {};
      for (const t of topicsData) {
        if (t.chapters) {
          topicMap[`${t.chapters.title}:${t.title}`] = t.id;
          chapterMap[t.chapters.title] = t.chapter_id;
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
        
        let chapterId = chapterMap[chapterTitle];
        if (!chapterId) {
          chapterId = await QuestionBankRepository.upsertChapter(chapterTitle);
          chapterMap[chapterTitle] = chapterId;
        }
        
        let topicId = topicMap[`${chapterTitle}:${topicTitle}`];
        if (!topicId) {
          topicId = await QuestionBankRepository.upsertTopic(chapterId, topicTitle);
          topicMap[`${chapterTitle}:${topicTitle}`] = topicId;
        }
        
        const isNew = q.id.startsWith('seed-') || q.id.startsWith('q-');
        const dbId = isNew ? crypto.randomUUID() : q.id;

        questionsToUpsert.push({
          id: dbId,
          topic_id: topicId,
          prompt: q.question,
          options: q.options,
          difficulty_level: diffMap[q.difficulty] || 2
        });

        answersToUpsert.push({
          question_id: dbId,
          correct_option_id: q.answer || 'A'
        });
      }

      return await QuestionBankRepository.saveBank(questionsToUpsert, answersToUpsert);
    } catch (e) {
      throw new Error(`QuestionBankService.saveBank failed: ${e.message}`);
    }
  }
}
