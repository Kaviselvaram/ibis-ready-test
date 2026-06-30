import { z } from "zod";
import { createSchema } from "../common/schemaFactory.js";

export const MediaRequest = createSchema({
  media_id: z.string().uuid("Invalid media ID"),
});

export const MediaResponse = createSchema({
  url: z.string().url()
});

export const VideoRequest = createSchema({
  topic_id: z.string().uuid("Invalid topic ID"),
});

export const VideoResponse = createSchema({
  id: z.string().uuid(),
  title: z.string(),
  url: z.string().url(),
  duration: z.string(),
  order: z.number().int().optional()
});
