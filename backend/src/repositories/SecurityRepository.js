import { getServiceSupabase } from "../config/supabase.js";

export class SecurityRepository {
  static async updateTotpSeed(adminId, encryptedSecret) {
    const supabase = getServiceSupabase();
    return supabase.from('profiles').update({ totp_seed: encryptedSecret }).eq('id', adminId);
  }

  static async getTotpSeed(adminId) {
    const supabase = getServiceSupabase();
    return supabase.from('profiles').select('totp_seed').eq('id', adminId).single();
  }
}
