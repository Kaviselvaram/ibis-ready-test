import { z } from "zod";
import { createSchema } from "../common/schemaFactory.js";

const VideoResponse = z.object({
  id: z.string(),
  label: z.string(),
  title: z.string(),
  url: z.string().url(),
  duration: z.string()
});

const NoteResponse = z.object({
  id: z.string(),
  title: z.string(),
  type: z.string(),
  content: z.string()
});

export const TopicResponse = z.object({
  id: z.string(),
  name: z.string(),
  isFree: z.boolean(),
  videos: z.array(VideoResponse),
  examples: z.array(VideoResponse).optional(),
  notes: z.array(NoteResponse).optional(),
  testReady: z.boolean()
});

export const CourseResponse = createSchema({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  image: z.string(),
  progress: z.number().min(0).max(100),
  topics: z.array(TopicResponse)
});
