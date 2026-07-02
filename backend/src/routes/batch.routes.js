import { Router } from "express";
import { withHandler } from "../utils/routeBuilder.js";
import { getBatches, saveBatches, deleteBatch, getBatchAnalytics, joinBatch, getMyBatch } from "../controllers/batch.controller.js";
import { z } from "zod";

const router = Router();

// Student-facing: join a batch by code + read own batch. Declared first so they
// keep their own (non-admin) auth policy and don't collide with "/:id".
router.post("/join", withHandler({
  method: "POST",
  schema: z.object({ code: z.string().trim().min(1).max(40) }),
  requireAuth: true
}, joinBatch));

router.get("/mine", withHandler({
  method: "GET",
  schema: z.object({}).strict(),
  requireAuth: true
}, getMyBatch));

router.get("/", withHandler({
  method: "GET",
  schema: z.object({}).strict(),
  requireAuth: true,
  roles: ["admin"]
}, getBatches));

router.post("/", withHandler({
  method: "POST",
  schema: z.any(),
  requireAuth: true,
  roles: ["admin"]
}, saveBatches));

router.get("/:id/analytics", withHandler({
  method: "GET",
  schema: z.object({}).strict(),
  requireAuth: true,
  roles: ["admin"]
}, getBatchAnalytics));

router.delete("/:id", withHandler({
  method: "DELETE",
  schema: z.object({}).strict(),
  requireAuth: true,
  roles: ["admin"]
}, deleteBatch));

export default router;
