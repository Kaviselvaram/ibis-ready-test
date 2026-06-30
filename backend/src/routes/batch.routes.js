import { Router } from "express";
import { withHandler } from "../utils/routeBuilder.js";
import { getBatches, saveBatches } from "../controllers/batch.controller.js";
import { z } from "zod";

const router = Router();

router.get("/", withHandler({
  method: "GET",
  schema: z.object({}).strict(),
  requireAuth: true
}, getBatches));

router.post("/", withHandler({
  method: "POST",
  schema: z.any(),
  requireAuth: true
}, saveBatches));

export default router;
