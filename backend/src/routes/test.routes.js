import { Router } from "express";
import { withHandler } from "../utils/routeBuilder.js";
import { generateTest, evaluateTest } from "../controllers/test.controller.js";
import { z } from "zod";

const router = Router();

router.post("/generate", withHandler({
  method: "POST",
  schema: z.object({
    chapter: z.string().nullable().optional(),
    topic: z.string().nullable().optional(),
    count: z.number().int().positive()
  }),
  requireAuth: true
}, generateTest));

router.post("/evaluate", withHandler({
  method: "POST",
  schema: z.object({
    questions: z.array(z.any()),
    answers: z.record(z.any()),
    meta: z.any()
  }),
  requireAuth: true
}, evaluateTest));

export default router;
