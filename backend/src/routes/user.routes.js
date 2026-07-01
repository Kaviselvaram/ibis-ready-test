import { Router } from "express";
import { z } from "zod";
import { withHandler } from "../utils/routeBuilder.js";
import { getMe, deleteUserAccount } from "../controllers/user.controller.js";
import { UserDeleteRequest } from "../../../shared/contracts/v1/user/user.dto.js";

const router = Router();

router.get("/me", withHandler({
  method: "GET",
  schema: z.object({}).strict(),
  requireAuth: true,
  roles: ['student', 'admin']
}, getMe));

router.delete("/delete", withHandler({
  method: "DELETE",
  schema: UserDeleteRequest,
  requireAuth: true,
  roles: ['student', 'admin'],
  rateLimit: { max: 3, windowMs: 60000, name: "delete_user" }
}, deleteUserAccount));

export default router;
