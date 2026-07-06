import { Router } from "express";
import { withHandler } from "../utils/routeBuilder.js";
import { loginController, refreshController, logoutController, signupController, forgotPasswordController, resetPasswordController } from "../controllers/auth.controller.js";
import { LoginRequest, EmptyRequest, SignupRequest } from "../../../shared/contracts/v1/auth/auth.dto.js";
import { z } from "zod";

const router = Router();

// LoginRequest / SignupRequest now include the optional turnstileToken field
// (enforced server-side only when TURNSTILE_SECRET_KEY is set).
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

// Password reset — request a link, then set a new password with the token.
router.post("/forgot-password", withHandler({
  method: "POST",
  schema: z.object({ email: z.string().trim().email() }),
  requireAuth: false,
  rateLimit: { max: 5, windowMs: 60000, name: "forgot_pw" }
}, forgotPasswordController));

router.post("/reset-password", withHandler({
  method: "POST",
  schema: z.object({
    token: z.string().min(10).max(200),
    password: z.string().min(8, "Password must be at least 8 characters").max(200)
  }),
  requireAuth: false,
  rateLimit: { max: 10, windowMs: 60000, name: "reset_pw" }
}, resetPasswordController));

export default router;
