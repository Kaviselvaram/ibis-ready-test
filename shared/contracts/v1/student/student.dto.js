import { z } from "zod";
import { createSchema } from "../common/schemaFactory.js";
import { ACCESS_LEVELS, PAYMENT_STATES } from "./StudentEnums.js";

export const CreateStudentRequest = createSchema({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string(),
  school: z.string(),
  grade: z.string(),
  batchCode: z.string().optional()
});

export const UpdateStudentRequest = createSchema({
  name: z.string().optional(),
  phone: z.string().optional(),
  school: z.string().optional(),
  batchCode: z.string().optional(),
  access: z.enum(Object.values(ACCESS_LEVELS)).optional(),
  paymentStatus: z.enum(Object.values(PAYMENT_STATES)).optional()
});

export const StudentResponse = createSchema({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  school: z.string(),
  grade: z.string(),
  batchCode: z.string(),
  access: z.enum(Object.values(ACCESS_LEVELS)),
  paymentStatus: z.enum(Object.values(PAYMENT_STATES)),
  joinDate: z.string(), // ISO-8601
  lastActive: z.string().optional(),
  studyTimeHrs: z.number(),
  accuracy: z.number(),
  avgScore: z.number(),
  rank: z.number(),
  testsTaken: z.number(),
  badges: z.number(),
  notesUnlocked: z.boolean(),
  progress: z.array(z.object({
    chapter: z.string(),
    percent: z.number()
  })),
  testHistory: z.array(z.object({
    date: z.string(),
    name: z.string(),
    score: z.number(),
    total: z.number()
  }))
});

export const StudentSummaryResponse = createSchema({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  rank: z.number(),
  avgScore: z.number()
});
