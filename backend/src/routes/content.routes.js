import { Router } from "express";
import { z } from "zod";
import { withHandler } from "../utils/routeBuilder.js";
import { getMedia, getVideo, getPricingController, createUploadUrl, updatePricingController } from "../controllers/ContentController.js";
import { MediaRequest, VideoRequest } from "../../../shared/contracts/v1/content/content.dto.js";

const router = Router();

router.get("/pricing", withHandler({
  method: "GET",
  schema: z.object({}).strict(),
  requireAuth: false
}, getPricingController));

// Admin: update the editable pricing config → reflects instantly on checkout.
router.put("/pricing", withHandler({
  method: "PUT",
  schema: z.object({
    currency: z.string().trim().max(8).optional(),
    defaultPlan: z.enum(["starter", "pro"]).optional(),
    plans: z.array(z.object({
      id: z.enum(["starter", "pro"]),
      name: z.string().trim().min(1).max(60),
      period: z.string().trim().min(1).max(20),
      price: z.number().int().min(0).max(10000000),
      badge: z.string().trim().max(60).optional().default(""),
      buttonText: z.string().trim().min(1).max(40),
      addon: z.object({
        label: z.string().trim().max(80),
        price: z.number().int().min(0).max(10000000)
      }).nullable().optional(),
      features: z.array(z.object({
        text: z.string().trim().min(1).max(120),
        enabled: z.boolean()
      })).max(20)
    })).min(1).max(4)
  }),
  requireAuth: true,
  roles: ["admin"],
  rateLimit: { max: 30, windowMs: 60000, name: "admin_pricing", byUser: true }
}, updatePricingController));

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
