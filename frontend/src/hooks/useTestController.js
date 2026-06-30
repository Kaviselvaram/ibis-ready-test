import { QuestionBankRepository, selectQuestions, buildReport, answerIndex } from "../repositories/QuestionBankRepository";

export const useTestController = () => {
  const loadBank = async () => {
    return await QuestionBankRepository.loadBank();
  };

  const generateTest = async (bank, config) => {
    return await selectQuestions(bank, config);
  };

  const submitTest = async (questions, answers, meta) => {
    return await buildReport(questions, answers, meta);
  };

  const getAnswerIndex = (q) => answerIndex(q);

  return {
    loadBank,
    generateTest,
    submitTest,
    getAnswerIndex
  };
};
