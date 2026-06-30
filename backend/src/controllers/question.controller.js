import { QuestionBankService } from "../services/QuestionBankService.js";

export const getBank = async () => {
  return await QuestionBankService.getBank();
};

export const saveBank = async ({ validatedData }) => {
  await QuestionBankService.saveBank(validatedData);
  return { success: true };
};
