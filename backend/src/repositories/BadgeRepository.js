import { getServiceSupabase } from "../config/supabase.js";
import { RepositoryError } from "../errors/RepositoryError.js";

// Data access for gamification: earned badges + the raw signals the engine needs
// (event counts/dates, attempts). All reads are per-user and cheap.
export class BadgeRepository {
  static async countEvents(profileId, type) {
    const supabase = getServiceSupabase();
    const { count, error } = await supabase
      .from("activity_events")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("event_type", type);
    if (error) throw new RepositoryError(error.message, error, "badge.countEvents");
    return count || 0;
  }

  static async getEventDates(profileId, types) {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("activity_events")
      .select("created_at, event_type")
      .eq("profile_id", profileId)
      .in("event_type", types)
      .order("created_at", { ascending: true })
      .limit(5000);
    if (error) throw new RepositoryError(error.message, error, "badge.getEventDates");
    return (data || []).map((r) => r.created_at);
  }

  static async getEarned(profileId) {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("user_badges")
      .select("badge_key, earned_at, granted_by")
      .eq("profile_id", profileId);
    if (error) throw new RepositoryError(error.message, error, "badge.getEarned");
    return data || [];
  }

  // Award badges (idempotent — unique(profile_id,badge_key)). grantedBy is the
  // admin id for manual grants, null for auto-awards.
  static async award(profileId, badgeKeys, grantedBy = null) {
    if (!badgeKeys?.length) return { awarded: 0 };
    const supabase = getServiceSupabase();
    const rows = badgeKeys.map((badge_key) => ({ profile_id: profileId, badge_key, granted_by: grantedBy }));
    const { error } = await supabase
      .from("user_badges")
      .upsert(rows, { onConflict: "profile_id,badge_key", ignoreDuplicates: true });
    if (error) throw new RepositoryError(error.message, error, "badge.award");
    return { awarded: rows.length };
  }

  static async revoke(profileId, badgeKey) {
    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from("user_badges")
      .delete()
      .eq("profile_id", profileId)
      .eq("badge_key", badgeKey);
    if (error) throw new RepositoryError(error.message, error, "badge.revoke");
    return { ok: true };
  }

  // Earned-badge counts for a set of profiles — powers the leaderboard's real
  // badge column (replacing the old mock count).
  static async countsByProfiles(profileIds) {
    if (!profileIds?.length) return {};
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("user_badges")
      .select("profile_id")
      .in("profile_id", profileIds);
    if (error) throw new RepositoryError(error.message, error, "badge.countsByProfiles");
    const counts = {};
    (data || []).forEach((r) => { counts[r.profile_id] = (counts[r.profile_id] || 0) + 1; });
    return counts;
  }
}
