import { getServiceSupabase } from "../config/supabase.js";
import { UserResponse } from "../../../shared/contracts/v1/user/user.dto.js";

export class UserRepository {
  static async signIn(email, password) {
    // DO NOT use getServiceSupabase() here! 
    // signInWithPassword mutates the client's internal auth state.
    // Since getServiceSupabase is a singleton, it would switch the entire backend's
    // privileges to the logged-in user instead of the service role!
    const { createClient } = await import("@supabase/supabase-js");
    const { env } = await import("../config/env.js");
    const ephemeralSupabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data, error } = await ephemeralSupabase.auth.signInWithPassword({ email, password });
    return { data, error };
  }

  static async signUp(email, password, metadata) {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata
    });
    return { data, error };
  }

  static async getUserById(userId) {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (!error && data?.user) {
      return { 
        data: {
           user: UserResponse.parse({
             id: data.user.id,
             email: data.user.email,
             role: 'student', // placeholder until profile is hydrated
             batchId: null
           })
        }, 
        error 
      };
    }
    return { data, error };
  }

  static async getProfile(userId) {
    const supabase = getServiceSupabase();
    return supabase.from('profiles').select('is_admin, batch_id, full_name, email').eq('id', userId).single();
  }

  // Full profile for GET /user/me
  static async getFullProfile(userId) {
    const supabase = getServiceSupabase();
    return supabase
      .from('profiles')
      .select('id, email, full_name, is_admin, batch_id, phone, school, grade, created_at')
      .eq('id', userId)
      .single();
  }

  // Idempotently ensure a profile row exists for an auth user.
  // ignoreDuplicates => never clobbers an existing row (e.g. an admin's is_admin flag).
  static async upsertProfile({ id, email, full_name }) {
    const supabase = getServiceSupabase();
    return supabase
      .from('profiles')
      .upsert(
        { id, email, full_name: full_name || null, is_admin: false },
        { onConflict: 'id', ignoreDuplicates: true }
      );
  }

  static async deleteUser(userId) {
    const supabase = getServiceSupabase();
    return supabase.auth.admin.deleteUser(userId);
  }

  static async logDeletion(userIdHash) {
    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from('deletion_log')
      .insert({ user_id_hash: userIdHash, deleted_at: new Date().toISOString() });
    if (error) console.error("Warning: Could not log deletion (missing table):", error.message);
    return { error: null }; // Suppress error for MVP
  }
}
