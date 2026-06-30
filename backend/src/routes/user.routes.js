import { Router } from "express";
import { withHandler } from "../utils/routeBuilder.js";
import { deleteUserAccount } from "../controllers/user.controller.js";
import { UserDeleteRequest } from "../../../shared/contracts/v1/user/user.dto.js";

const router = Router();

router.delete("/delete", withHandler({
  method: "DELETE",
  schema: UserDeleteRequest,
  requireAuth: true,
  roles: ['student', 'admin'],
  rateLimit: { max: 3, windowMs: 60000, name: "delete_user" }
}, deleteUserAccount));

export default router;
