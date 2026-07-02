import { BatchService } from "../services/BatchService.js";
import { AppError } from "../errors/AppError.js";

export const getBatches = async () => {
  return await BatchService.getBatches();
};

export const saveBatches = async ({ validatedData }) => {
  await BatchService.saveBatches(validatedData);
  return { success: true };
};

export const deleteBatch = async ({ req }) => {
  await BatchService.deleteBatch(req.params.id);
  return { success: true };
};

export const getBatchAnalytics = async ({ req }) => {
  return await BatchService.getBatchAnalytics(req.params.id);
};

export const joinBatch = async ({ req, validatedData }) => {
  try {
    return await BatchService.joinBatch(req.user.sub, validatedData.code);
  } catch (e) {
    if (e.statusCode) throw new AppError(e.message, e.statusCode, "BATCH_JOIN");
    throw e;
  }
};

export const getMyBatch = async ({ req }) => {
  return await BatchService.getMyBatch(req.user.sub);
};
