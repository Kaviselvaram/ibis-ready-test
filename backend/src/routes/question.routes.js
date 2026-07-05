import { Router } from "express";
import { withHandler } from "../utils/routeBuilder.js";
import { getBank, saveBank } from "../controllers/question.controller.js";
import { z } from "zod";

const router = Router();

// The question bank contains correct answers and is the source for every test.
// It is ADMIN-ONLY: reading it (answer key) or replacing it must never be
// available to students. (Audit P0: previously only requireAuth, no role guard.)
router.get("/", withHandler({
  method: "GET",
  schema: z.object({}).strict(),
  requireAuth: true,
  roles: ["admin"],
  rateLimit: { max: 60, windowMs: 60000, name: "admin_question", byUser: true }
}, getBank));

router.post("/", withHandler({
  method: "POST",
  schema: z.any(),
  requireAuth: true,
  roles: ["admin"],
  rateLimit: { max: 30, windowMs: 60000, name: "admin_question_write", byUser: true }
}, saveBank));

export default router;
