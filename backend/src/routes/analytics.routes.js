import { Router } from "express";
import { withHandler } from "../utils/routeBuilder.js";
import { getAnalytics, logEvent } from "../controllers/analytics.controller.js";
import { z } from "zod";

const router = Router();

// Admin dashboard analytics (backend-aggregated, real data only).
router.get("/", withHandler({
  method: "GET",
  schema: z.object({ force: z.string().optional() }),
  requireAuth: true,
  roles: ["admin"],
  rateLimit: { max: 60, windowMs: 60000, name: "admin_analytics", byUser: true }
}, getAnalytics));

// Engagement event logging (any authenticated user). Rate-limited generously
// since it fires on content views.
router.post("/event", withHandler({
  method: "POST",
  schema: z.object({
    event_type: z.string().trim().min(1).max(60),
    chapter_id: z.string().uuid().nullable().optional(),
    topic_id: z.string().uuid().nullable().optional(),
    metadata: z.record(z.string(), z.any()).nullable().optional()
  }),
  requireAuth: true,
  rateLimit: { max: 240, windowMs: 60000, name: "activity_event", byUser: true }
}, logEvent));

export default router;
