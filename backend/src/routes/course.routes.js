import { Router } from "express";
import { withHandler } from "../utils/routeBuilder.js";
import { getChapters, getStudyData } from "../controllers/course.controller.js";
import { z } from "zod";

const router = Router();

router.get("/chapters", withHandler({
  method: "GET",
  schema: z.object({}).strict(),
  requireAuth: false
}, getChapters));

router.get("/study-data", withHandler({
  method: "GET",
  schema: z.object({}).strict(),
  requireAuth: true
}, getStudyData));

export default router;
