import { Router } from "express";
import { withHandler } from "../utils/routeBuilder.js";
import { getHealth, getLiveness, getReadiness } from "../controllers/health.controller.js";
import { z } from "zod";

const router = Router();
const EmptySchema = z.object({}).strict();

router.get("/", withHandler({
  method: "GET",
  schema: EmptySchema,
  requireAuth: false
}, getHealth));

router.get("/live", withHandler({
  method: "GET",
  schema: EmptySchema,
  requireAuth: false
}, getLiveness));

router.get("/ready", withHandler({
  method: "GET",
  schema: EmptySchema,
  requireAuth: false
}, getReadiness));

export default router;
