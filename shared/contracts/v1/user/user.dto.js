import { z } from "zod";
import { createSchema } from "../common/schemaFactory.js";

export const UserDeleteRequest = createSchema({
  confirmPhrase: z.literal('DELETE MY ACCOUNT')
});

export const UserResponse = createSchema({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["student", "admin"]),
  batchId: z.string().nullable().optional()
});
