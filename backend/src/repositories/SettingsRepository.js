import { getServiceSupabase } from "../config/supabase.js";
import { RepositoryError } from "../errors/RepositoryError.js";

// Key/value settings store (app_settings). Used for admin-configurable
// generation distribution and any future tunables.
export class SettingsRepository {
  static async get(key) {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) throw new RepositoryError(error.message, error, "settings.get");
    return data?.value ?? null;
  }

  static async set(key, value) {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("app_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" })
      .select("value")
      .single();
    if (error) throw new RepositoryError(error.message, error, "settings.set");
    return data?.value ?? value;
  }
}
