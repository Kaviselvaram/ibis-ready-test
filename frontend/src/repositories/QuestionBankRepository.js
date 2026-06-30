import { api } from '../api/ApiClient';
import { DIFFICULTIES, BLOOM_LEVELS } from '../../../shared/contracts/v1/question/QuestionEnums.js';

export { DIFFICULTIES, BLOOM_LEVELS };

const LETTERS = ["A", "B", "C", "D", "E", "F"];
export function answerIndex(q) {
  return LETTERS.indexOf((q.answer || "").trim().toUpperCase());
}

export const loadBank = async () => {
  return await api.get('/question');
};

export const saveBank = async (bank) => {
  await api.post('/question', bank);
  return true;
};

export const QuestionBankRepository = {
  loadBank,
  saveBank
};

const REQUIRED = ["chapter", "topic", "question", "options", "answer"];

// Validates and normalizes incoming JSON (array or single object).
export function normalizeUpload(input) {
  let data = input;
  if (typeof input === "string") {
    data = JSON.parse(input);
  }
  const rows = Array.isArray(data) ? data : [data];
  const valid = [];
  const errors = [];

  rows.forEach((row, idx) => {
    const missing = REQUIRED.filter((k) => row[k] === undefined || row[k] === null || row[k] === "");
    if (!Array.isArray(row.options) || row.options.length < 2) missing.push("options(>=2)");
    const ansLetter = String(row.answer || "").trim().toUpperCase();
    const ansOk = LETTERS.includes(ansLetter) && LETTERS.indexOf(ansLetter) < (row.options?.length || 0);
    if (!ansOk) missing.push("answer(A–" + LETTERS[(row.options?.length || 1) - 1] + ")");

    if (missing.length) {
      errors.push(`Question ${idx + 1}: missing/invalid ${missing.join(", ")}`);
      return;
    }
    valid.push({
      id: row.id || `q-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
      chapter: String(row.chapter).trim(),
      topic: String(row.topic).trim(),
      questionType: row.questionType || "MCQ",
      bloomLevel: row.bloomLevel || "Understand",
      difficulty: Object.values(DIFFICULTIES).includes(row.difficulty) ? row.difficulty : "Medium",
      question: String(row.question).trim(),
      options: row.options.map((o) => String(o)),
      answer: ansLetter,
      explanation: row.explanation || "No explanation provided.",
      source: row.source || "Uploaded",
    });
  });

  return { valid, errors };
}

export async function selectQuestions(bank, { chapter = null, topic = null, count }) {
  // bank is no longer needed but kept for signature compatibility
  return await api.post('/test/generate', { chapter, topic, count });
}

export async function buildReport(questions, answers, meta) {
  return await api.post('/test/evaluate', { questions, answers, meta });
}

export function bankSummary(bank) {
  const byChapter = {};
  bank.forEach((q) => {
    byChapter[q.chapter] = (byChapter[q.chapter] || 0) + 1;
  });
  return {
    total: bank.length,
    chapters: Object.entries(byChapter)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
  };
}
