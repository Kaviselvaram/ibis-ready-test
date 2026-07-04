import { TestEngineService } from "../services/TestEngineService.js";

export const getTestScope = async () => {
  return await TestEngineService.getScope();
};

export const generateTest = async ({ validatedData, user }) => {
  return await TestEngineService.generateTest(validatedData, user?.sub || null);
};

export const evaluateTest = async ({ validatedData, user }) => {
  return await TestEngineService.evaluateTest(validatedData, user?.sub);
};

// ---- Admin test management ----
export const listTests = async () => {
  return await TestEngineService.listTests();
};

export const createTest = async ({ validatedData }) => {
  return await TestEngineService.createTest(validatedData);
};

export const updateTest = async ({ req, validatedData }) => {
  return await TestEngineService.updateTest(req.params.id, validatedData);
};

export const deleteTest = async ({ req }) => {
  return await TestEngineService.deleteTest(req.params.id);
};

// ---- Student ----
export const availableTests = async () => {
  return await TestEngineService.listAvailableTests();
};

export const startTest = async ({ req, user }) => {
  return await TestEngineService.startTest(req.params.id, user?.sub || null);
};

// ---- Admin: generation distribution config (#7/#8) ----
export const getGenConfig = async () => {
  return await TestEngineService.getGenerationConfig();
};

export const updateGenConfig = async ({ validatedData }) => {
  try {
    return await TestEngineService.updateGenerationConfig(validatedData);
  } catch (e) {
    if (e.statusCode === 400) {
      const { AppError } = await import("../errors/AppError.js");
      throw new AppError(e.message, 400, "BAD_INPUT");
    }
    throw e;
  }
};

// ---- Test history + single result ----
// Students see their own; admins may pass ?profileId=<id> to view any student's.
export const testHistory = async ({ req, user }) => {
  const profileId = (user.role === "admin" && req.query.profileId) ? req.query.profileId : user.sub;
  return await TestEngineService.getHistory(profileId);
};

export const testResult = async ({ req, user }) => {
  return await TestEngineService.getResult(req.params.id, user);
};
