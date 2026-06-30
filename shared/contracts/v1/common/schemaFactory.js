import { z } from "zod";

/**
 * Zod schema factory with built-in sanitizations.
 * 1. Trim whitespace
 * 2. Strip null bytes
 * 3. Enforce maxLength
 */
export const ZodSanitized = {
  string: (maxLen) => z.string()
    .trim()
    .max(maxLen, `Maximum length is ${maxLen}`)
    .transform(val => val.replace(/\0/g, '')), // Strip null bytes
    
  email: () => z.string()
    .trim()
    .email("Invalid email format")
    .toLowerCase()
    .max(255)
    .transform(val => val.replace(/\0/g, '')),
};

export const createSchema = (shape) => {
  return z.object(shape).strict(); // strict() rejects unknown keys to prevent mass assignment
};
