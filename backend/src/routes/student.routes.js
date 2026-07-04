import { Router } from "express";
import { withHandler } from "../utils/routeBuilder.js";
import { getStudents, saveStudents, deleteStudent, bulkCreateStudents, getLeaderboard, getProgress, getRank } from "../controllers/student.controller.js";
import { z } from "zod";

const bulkSchema = z.object({
  sendEmail: z.boolean().optional().default(true),
  // Email is validated per-row inside the service so ONE bad row doesn't reject
  // the whole import — invalid/duplicate rows are reported, not blocking (#12).
  rows: z.array(z.object({
    full_name: z.string().trim().max(200).optional().default(""),
    email: z.string().trim().max(200).optional().default(""),
    phone: z.string().trim().max(40).optional().default(""),
    grade: z.string().trim().max(40).optional().default(""),
    batch_code: z.string().trim().max(40).optional().default("")
  })).min(1).max(1000)
});

const router = Router();

// Leaderboard is student-facing (any authenticated user).
router.get("/leaderboard", withHandler({
  method: "GET",
  schema: z.object({}).strict(),
  requireAuth: true
}, getLeaderboard));

// Personal progress dashboard (student-facing).
router.get("/progress", withHandler({
  method: "GET",
  schema: z.object({}).strict(),
  requireAuth: true
}, getProgress));

// Rank summary — global for universal students, batch for batch students (#9).
router.get("/rank", withHandler({
  method: "GET",
  schema: z.object({}).strict(),
  requireAuth: true
}, getRank));

// Roster management is admin-only.
router.get("/", withHandler({
  method: "GET",
  schema: z.object({}).strict(),
  requireAuth: true,
  roles: ["admin"]
}, getStudents));

router.post("/", withHandler({
  method: "POST",
  schema: z.any(), // Accepts an array of students
  requireAuth: true,
  roles: ["admin"]
}, saveStudents));

router.post("/bulk", withHandler({
  method: "POST",
  schema: bulkSchema,
  requireAuth: true,
  roles: ["admin"]
}, bulkCreateStudents));

router.delete("/:id", withHandler({
  method: "DELETE",
  schema: z.object({}).strict(),
  requireAuth: true,
  roles: ["admin"]
}, deleteStudent));

export default router;
