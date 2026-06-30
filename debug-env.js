import { env } from "./backend/src/config/env.js";
console.log("URL:", env.SUPABASE_URL);
console.log("KEY:", env.SUPABASE_SERVICE_ROLE_KEY ? "EXISTS" : "MISSING");
