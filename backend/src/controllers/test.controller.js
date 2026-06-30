import { TestEngineService } from "../services/TestEngineService.js";

export const generateTest = async ({ validatedData }) => {
  return await TestEngineService.generateTest(validatedData);
};

export const evaluateTest = async ({ validatedData }) => {
  return await TestEngineService.evaluateTest(validatedData);
};
