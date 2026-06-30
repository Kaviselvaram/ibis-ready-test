import { Router } from "express";
import { withHandler } from "../utils/routeBuilder.js";
import { getBank, saveBank } from "../controllers/question.controller.js";
import { z } from "zod";

const router = Router();

router.get("/", withHandler({
  method: "GET",
  schema: z.object({}).strict(),
  requireAuth: true
}, getBank));

router.post("/", withHandler({
  method: "POST",
  schema: z.any(),
  requireAuth: true
}, saveBank));

export default router;
