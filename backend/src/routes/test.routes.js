import { Router } from "express";
import { withHandler } from "../utils/routeBuilder.js";
import {
  generateTest, evaluateTest,
  listTests, createTest, updateTest, deleteTest,
  availableTests, startTest,
  testHistory, testResult
} from "../controllers/test.controller.js";
import { z } from "zod";

const router = Router();

const TEST_TYPES = ["half_chapter", "full_chapter", "combined", "full_syllabus"];

const admin = (schema, controller) => withHandler({
  schema,
  requireAuth: true,
  roles: ["admin"],
  rateLimit: { max: 60, windowMs: 60000, name: "admin_tests", byUser: true }
}, controller);

// ---- Existing engine ----
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

// ---- Student: browse live tests + start ----
router.get("/available", withHandler({
  method: "GET", schema: z.object({}).strict(), requireAuth: true
}, availableTests));

router.post("/start/:id", withHandler({
  method: "POST", schema: z.object({}).strict(), requireAuth: true
}, startTest));

// ---- Test history + single result (student owns theirs; admin sees any) ----
router.get("/history", withHandler({
  method: "GET",
  schema: z.object({ profileId: z.string().uuid().optional() }),
  requireAuth: true,
  roles: ["student", "admin"]
}, testHistory));

router.get("/result/:id", withHandler({
  method: "GET",
  schema: z.object({}).strict(),
  requireAuth: true,
  roles: ["student", "admin"]
}, testResult));

// ---- Admin: manage tests ----
router.get("/manage", admin(z.object({}).strict(), listTests));

router.post("/manage", admin(
  z.object({
    title: z.string().trim().min(1).max(200),
    test_type: z.enum(TEST_TYPES),
    chapter_ids: z.array(z.string().uuid()).default([]),
    question_count: z.number().int().min(1).max(200).default(20),
    duration_minutes: z.number().int().min(1).max(600).default(30),
    is_live: z.boolean().default(false)
  }),
  createTest
));

router.patch("/manage/:id", admin(
  z.object({
    title: z.string().trim().min(1).max(200).optional(),
    test_type: z.enum(TEST_TYPES).optional(),
    chapter_ids: z.array(z.string().uuid()).optional(),
    question_count: z.number().int().min(1).max(200).optional(),
    duration_minutes: z.number().int().min(1).max(600).optional(),
    is_live: z.boolean().optional()
  }),
  updateTest
));

router.delete("/manage/:id", admin(z.object({}).strict(), deleteTest));

export default router;
