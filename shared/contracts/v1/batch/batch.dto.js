import { z } from "zod";
import { createSchema } from "../common/schemaFactory.js";
import { BATCH_STATUS } from "./BatchEnums.js";

export const CreateBatchRequest = createSchema({
  name: z.string().min(1),
  school: z.string().min(1),
  code: z.string().min(1)
});

export const UpdateBatchRequest = createSchema({
  name: z.string().optional(),
  school: z.string().optional(),
  status: z.enum(Object.values(BATCH_STATUS)).optional()
});

export const BatchResponse = createSchema({
  id: z.string(),
  name: z.string(),
  school: z.string(),
  code: z.string(),
  count: z.number(),
  status: z.enum(Object.values(BATCH_STATUS)).optional()
});
