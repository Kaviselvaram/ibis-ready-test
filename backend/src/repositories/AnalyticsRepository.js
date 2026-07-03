import { getServiceSupabase } from "../config/supabase.js";
import { RepositoryError } from "../errors/RepositoryError.js";

// Read-only aggregation source for the admin analytics dashboard. Totals use
// head/count queries; time-series use bounded raw fetches aggregated in the
// service. Everything here is real DB data — no fabricated numbers.
export class AnalyticsRepository {
  static async _count(table, apply) {
    const supabase = getServiceSupabase();
    let q = supabase.from(table).select("*", { count: "exact", head: true });
    if (apply) q = apply(q);
    const { count, error } = await q;
    if (error) throw new RepositoryError(error.message, error, `count:${table}`);
    return count || 0;
  }

  // Counts that drive the KPI tiles.
  static async getCounts() {
    const [
      chapters, publishedChapters, freeChapters, topics, videos, notes,
      questions, tests, liveTests, students, batches, activeSubs
    ] = await Promise.all([
      this._count("chapters"),
      this._count("chapters", (q) => q.eq("is_published", true)),
      this._count("chapters", (q) => q.eq("is_free", true)),
      this._count("topics"),
      this._count("youtubes"),
      this._count("media", (q) => q.eq("media_type", "note")),
      this._count("questions"),
      this._count("tests"),
      this._count("tests", (q) => q.eq("is_live", true)),
      this._count("profiles", (q) => q.neq("is_admin", true)),
      this._count("batches"),
      this._count("subscriptions", (q) => q.eq("status", "active"))
    ]);
    return { chapters, publishedChapters, freeChapters, topics, videos, notes, questions, tests, liveTests, students, batches, activeSubs };
  }

  // Profiles (created_at for the signups trend + batch join for batch analytics).
  static async getProfiles() {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, created_at, batch_id, is_admin")
      .neq("is_admin", true);
    if (error) throw new RepositoryError(error.message, error, "analytics.profiles");
    return data || [];
  }

  // Test attempts within the window (score trend, attempts/day, activity).
  static async getAttempts(sinceIso) {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("test_attempts")
      .select("profile_id, score, test_type, completed_at")
      .gte("completed_at", sinceIso)
      .order("completed_at", { ascending: true })
      .limit(5000);
    if (error) throw new RepositoryError(error.message, error, "analytics.attempts");
    return data || [];
  }

  // Engagement events within the window (content views by type/day/chapter).
  static async getEvents(sinceIso) {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("activity_events")
      .select("profile_id, event_type, chapter_id, created_at")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: true })
      .limit(10000);
    if (error) throw new RepositoryError(error.message, error, "analytics.events");
    return data || [];
  }

  static async getChapterTitles() {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase.from("chapters").select("id, title");
    if (error) throw new RepositoryError(error.message, error, "analytics.chapterTitles");
    return data || [];
  }

  static async getBatches() {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase.from("batches").select("id, name, code");
    if (error) throw new RepositoryError(error.message, error, "analytics.batches");
    return data || [];
  }

  // Persist a single engagement event (best-effort at the service layer).
  static async logEvent({ profile_id, event_type, chapter_id = null, topic_id = null, metadata = null }) {
    const supabase = getServiceSupabase();
    const { error } = await supabase.from("activity_events").insert({
      profile_id, event_type, chapter_id, topic_id, metadata
    });
    if (error) throw new RepositoryError(error.message, error, "analytics.logEvent");
    return { ok: true };
  }
}
