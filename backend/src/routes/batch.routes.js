import { Router } from "express";
import { withHandler } from "../utils/routeBuilder.js";
import { getBatches, saveBatches, deleteBatch } from "../controllers/batch.controller.js";
import { z } from "zod";

const router = Router();

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

router.delete("/:id", withHandler({
  method: "DELETE",
  schema: z.object({}).strict(),
  requireAuth: true,
  roles: ["admin"]
}, deleteBatch));

export default router;
