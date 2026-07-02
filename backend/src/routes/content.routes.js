import { Router } from "express";
import { z } from "zod";
import { withHandler } from "../utils/routeBuilder.js";
import { getMedia, getVideo, getPricingController, createUploadUrl } from "../controllers/ContentController.js";
import { MediaRequest, VideoRequest } from "../../../shared/contracts/v1/content/content.dto.js";

const router = Router();

router.get("/pricing", withHandler({
  method: "GET",
  schema: z.object({}).strict(),
  requireAuth: false
}, getPricingController));

// Signed upload URL for admin file uploads (thumbnails, PDF notes).
router.post("/upload-url", withHandler({
  method: "POST",
  schema: z.object({
    kind: z.enum(["thumbnail", "note"]),
    filename: z.string().trim().min(1).max(200)
  }),
  requireAuth: true,
  roles: ["admin"]
}, createUploadUrl));

router.all("/media", withHandler({
  schema: MediaRequest,
  requireAuth: true,
  rateLimit: { max: 30, windowMs: 60000, name: "media" }
}, getMedia));

router.all("/video", withHandler({
  schema: VideoRequest,
  requireAuth: true,
  rateLimit: { max: 45, windowMs: 60000, name: "video" }
}, getVideo));

export default router;
