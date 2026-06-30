import { Router } from "express";
import { withHandler } from "../utils/routeBuilder.js";
import { loginController, refreshController, logoutController, signupController } from "../controllers/auth.controller.js";
import { LoginRequest, EmptyRequest, SignupRequest } from "../../../shared/contracts/v1/auth/auth.dto.js";

const router = Router();

router.post("/login", withHandler({
  method: "POST",
  schema: LoginRequest,
  requireAuth: false,
  rateLimit: { max: 10, windowMs: 60000, name: "login" }
}, loginController));

router.post("/signup", withHandler({
  method: "POST",
  schema: SignupRequest,
  requireAuth: false,
  rateLimit: { max: 5, windowMs: 60000, name: "signup" }
}, signupController));

router.post("/refresh", withHandler({
  method: "POST",
  schema: EmptyRequest,
  requireAuth: false,
  rateLimit: { max: 20, windowMs: 60000, name: "refresh" }
}, refreshController));

router.post("/logout", withHandler({
  method: "POST",
  schema: EmptyRequest,
  requireAuth: true
}, logoutController));

export default router;
