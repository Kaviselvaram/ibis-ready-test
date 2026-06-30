import { z } from "zod";
import { createSchema, ZodSanitized } from "../common/schemaFactory.js";

// Validation and structure for Auth Endpoints
export const LoginRequest = createSchema({
  email: ZodSanitized.email(),
  password: z.string().min(1, "Password is required")
});

export const LoginResponse = createSchema({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    role: z.string()
  })
});

export const SignupRequest = createSchema({
  email: ZodSanitized.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1)
});

export const SignupResponse = createSchema({
  id: z.string().uuid(),
  email: z.string().email()
});

export const RefreshTokenRequest = createSchema({
  refresh_token: z.string() // Usually from cookie, but mapping just in case
}).optional(); // Can be empty if relying entirely on HttpOnly cookies

export const RefreshTokenResponse = createSchema({
  access_token: z.string()
});

export const EmptyRequest = z.object({}).strict();
