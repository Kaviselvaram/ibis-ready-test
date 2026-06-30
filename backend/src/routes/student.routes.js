import { Router } from "express";
import { withHandler } from "../utils/routeBuilder.js";
import { getStudents, saveStudents, getLeaderboard } from "../controllers/student.controller.js";
import { z } from "zod";

const router = Router();

router.get("/", withHandler({
  method: "GET",
  schema: z.object({}).strict(),
  requireAuth: true
}, getStudents));

router.post("/", withHandler({
  method: "POST",
  schema: z.any(), // Since it takes an array of students
  requireAuth: true
}, saveStudents));

router.get("/leaderboard", withHandler({
  method: "GET",
  schema: z.object({}).strict(),
  requireAuth: true
}, getLeaderboard));

export default router;
