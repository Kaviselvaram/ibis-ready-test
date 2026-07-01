import { TestEngineService } from "../services/TestEngineService.js";

export const generateTest = async ({ validatedData }) => {
  return await TestEngineService.generateTest(validatedData);
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

export const startTest = async ({ req }) => {
  return await TestEngineService.startTest(req.params.id);
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
