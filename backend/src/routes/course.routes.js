import { Router } from "express";
import { withHandler } from "../utils/routeBuilder.js";
import {
  getChapters, getStudyData,
  createChapter, updateChapter, deleteChapter, reorderChapters,
  createTopic, updateTopic, deleteTopic, reorderTopics,
  addVideo, deleteVideo
} from "../controllers/course.controller.js";
import { z } from "zod";

const router = Router();

const admin = (schema, controller) => withHandler({
  schema,
  requireAuth: true,
  roles: ["admin"],
  rateLimit: { max: 60, windowMs: 60000, name: "admin_course", byUser: true }
}, controller);

// ---- Public / authenticated reads ----
router.get("/chapters", withHandler({
  method: "GET", schema: z.object({}).strict(), requireAuth: false
}, getChapters));

router.get("/study-data", withHandler({
  method: "GET", schema: z.object({}).strict(), requireAuth: true
}, getStudyData));

// ---- Chapters (admin) ----  (reorder before :id so it isn't captured as an id)
router.post("/chapters", admin(
  z.object({ title: z.string().trim().min(1).max(200) }),
  createChapter
));
router.patch("/chapters/reorder", admin(
  z.object({ orderedIds: z.array(z.string().uuid()).min(1) }),
  reorderChapters
));
router.patch("/chapters/:id", admin(
  z.object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    is_published: z.boolean().optional()
  }),
  updateChapter
));
router.delete("/chapters/:id", admin(z.object({}).strict(), deleteChapter));

// ---- Topics (admin) ----
router.post("/topics", admin(
  z.object({
    chapter_id: z.string().uuid(),
    title: z.string().trim().min(1).max(200),
    is_free: z.boolean().optional()
  }),
  createTopic
));
router.patch("/topics/reorder", admin(
  z.object({ orderedIds: z.array(z.string().uuid()).min(1) }),
  reorderTopics
));
router.patch("/topics/:id", admin(
  z.object({
    title: z.string().trim().min(1).max(200).optional(),
    is_free: z.boolean().optional()
  }),
  updateTopic
));
router.delete("/topics/:id", admin(z.object({}).strict(), deleteTopic));

// ---- Videos / youtubes (admin) ----
router.post("/videos", admin(
  z.object({
    topic_id: z.string().uuid(),
    url: z.string().trim().min(1),
    title: z.string().trim().max(200).optional()
  }),
  addVideo
));
router.delete("/videos/:id", admin(z.object({}).strict(), deleteVideo));

export default router;
