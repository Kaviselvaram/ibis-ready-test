import { BatchService } from "../services/BatchService.js";

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
