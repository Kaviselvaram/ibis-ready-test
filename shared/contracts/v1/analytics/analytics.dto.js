import { z } from "zod";
import { createSchema } from "../common/schemaFactory.js";

export const AnalyticsResponse = createSchema({
  userId: z.string().uuid(),
  totalStudyTimeHrs: z.number().min(0),
  averageAccuracy: z.number().min(0).max(100),
  testsCompleted: z.number().int().min(0),
  recentActivity: z.array(z.object({
    date: z.string(), // ISO-8601
    action: z.string()
  }))
});
