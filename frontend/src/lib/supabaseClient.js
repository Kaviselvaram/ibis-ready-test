import { createClient } from "@supabase/supabase-js";

// Public, browser-safe values. Vite only exposes vars prefixed with VITE_.
// Row Level Security (RLS) on Supabase is what actually protects data — the
// anon key is meant to ship to the client.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  // Don't throw — let the app boot so the UI still renders during local dev.
  console.warn(
    "[supabase] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.local. " +
      "Auth is disabled until these are set."
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
