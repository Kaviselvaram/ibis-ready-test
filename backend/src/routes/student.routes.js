import { Router } from "express";
import { withHandler } from "../utils/routeBuilder.js";
import { getStudents, saveStudents, deleteStudent, getLeaderboard } from "../controllers/student.controller.js";
import { z } from "zod";

const router = Router();

// Leaderboard is student-facing (any authenticated user).
router.get("/leaderboard", withHandler({
  method: "GET",
  schema: z.object({}).strict(),
  requireAuth: true
}, getLeaderboard));

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

router.delete("/:id", withHandler({
  method: "DELETE",
  schema: z.object({}).strict(),
  requireAuth: true,
  roles: ["admin"]
}, deleteStudent));

export default router;
