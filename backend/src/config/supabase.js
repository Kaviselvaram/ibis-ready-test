import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

let supabaseInstance = null;

export const getServiceSupabase = () => {
  if (supabaseInstance) return supabaseInstance;

  supabaseInstance = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return supabaseInstance;
};
