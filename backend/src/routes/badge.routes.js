import { Router } from "express";
import { withHandler } from "../utils/routeBuilder.js";
import { myBadges, badgeCatalog, userBadges, grantBadge, revokeBadge } from "../controllers/badge.controller.js";
import { z } from "zod";

const router = Router();

const admin = (schema, controller) => withHandler({
  schema, requireAuth: true, roles: ["admin"],
  rateLimit: { max: 60, windowMs: 60000, name: "admin_badges", byUser: true }
}, controller);

// Student (or admin) — own badge gallery. Auto-awards newly earned on read.
router.get("/me", withHandler({
  method: "GET", schema: z.object({}).strict(), requireAuth: true
}, myBadges));

// Static catalog (any authenticated user).
router.get("/catalog", withHandler({
  method: "GET", schema: z.object({}).strict(), requireAuth: true
}, badgeCatalog));

// ---- Admin badge management (students can never reach these) ----
router.get("/user/:id", admin(z.object({}).strict(), userBadges));

router.post("/grant", admin(
  z.object({ profile_id: z.string().uuid(), badge_key: z.string().min(1).max(60) }),
  grantBadge
));

router.post("/revoke", admin(
  z.object({ profile_id: z.string().uuid(), badge_key: z.string().min(1).max(60) }),
  revokeBadge
));

export default router;
