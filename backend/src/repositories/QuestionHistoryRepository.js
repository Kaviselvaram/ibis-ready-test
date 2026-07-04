import { getServiceSupabase } from "../config/supabase.js";
import { RepositoryError } from "../errors/RepositoryError.js";

// Per-user record of which questions a student has already been served, so the
// generator can prefer fresh questions and reset a full cycle when exhausted (#6).
export class QuestionHistoryRepository {
  // Set of question_ids this user has already seen.
  static async getSeenIds(profileId) {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("question_history")
      .select("question_id")
      .eq("profile_id", profileId);
    if (error) throw new RepositoryError(error.message, error, "questionHistory.getSeenIds");
    return new Set((data || []).map((r) => r.question_id));
  }

  // Record served questions. Upsert on (profile_id, question_id) so re-serving
  // after a reset doesn't error on the unique constraint.
  static async recordSeen(profileId, questionIds) {
    if (!questionIds?.length) return { ok: true };
    const supabase = getServiceSupabase();
    const rows = questionIds.map((qid) => ({ profile_id: profileId, question_id: qid }));
    const { error } = await supabase
      .from("question_history")
      .upsert(rows, { onConflict: "profile_id,question_id", ignoreDuplicates: true });
    if (error) throw new RepositoryError(error.message, error, "questionHistory.recordSeen");
    return { ok: true };
  }

  // Clear a user's history — starts a fresh cycle once every question is seen.
  static async reset(profileId) {
    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from("question_history")
      .delete()
      .eq("profile_id", profileId);
    if (error) throw new RepositoryError(error.message, error, "questionHistory.reset");
    return { ok: true };
  }
}
