import { QuestionBankRepository, selectQuestions, buildReport, answerIndex } from "../repositories/QuestionBankRepository";

export const useTestController = () => {
  const loadBank = async () => {
    return await QuestionBankRepository.loadBank();
  };

  const generateTest = async (bank, config) => {
    return await selectQuestions(bank, config);
  };

  const submitTest = async (questions, answers, meta) => {
    // One automatic retry so a transient/cold-start hiccup doesn't lose a test.
    try {
      return await buildReport(questions, answers, meta);
    } catch (e) {
      await new Promise((r) => setTimeout(r, 1500));
      return await buildReport(questions, answers, meta);
    }
  };

  const getAnswerIndex = (q) => answerIndex(q);

  return {
    loadBank,
    generateTest,
    submitTest,
    getAnswerIndex
  };
};
