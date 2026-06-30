import { z } from "zod";
import { createSchema } from "../common/schemaFactory.js";
import { DIFFICULTIES, BLOOM_LEVELS } from "./QuestionEnums.js";

export const CreateQuestionRequest = createSchema({
  chapter: z.string(),
  topic: z.string(),
  questionType: z.string().default("MCQ"),
  bloomLevel: z.enum(Object.values(BLOOM_LEVELS)),
  difficulty: z.enum(Object.values(DIFFICULTIES)),
  question: z.string().min(1),
  options: z.array(z.string()).min(2),
  answer: z.string().min(1)
});

export const UpdateQuestionRequest = CreateQuestionRequest.partial();

export const QuestionResponse = createSchema({
  id: z.string(),
  chapter: z.string(),
  topic: z.string(),
  questionType: z.string(),
  bloomLevel: z.enum(Object.values(BLOOM_LEVELS)),
  difficulty: z.enum(Object.values(DIFFICULTIES)),
  question: z.string(),
  options: z.array(z.string()),
  answer: z.string() // Usually withheld on frontend tests, but needed for admin
});
