import { getServiceSupabase } from "../config/supabase.js";
import { RepositoryError } from "../errors/RepositoryError.js";

export class CourseRepository {
  static async getChapters(userId) {
    const supabase = getServiceSupabase();
    
    const { data, error } = await supabase
      .from('chapters')
      .select(`
        id, title, description, order_index, is_published, is_free, created_at,
        topics (
          id, title, order_index, is_free, created_at,
          youtubes (
            id, youtube_video_id, title, created_at
          ),
          media (
            id, title, r2_object_key, media_type, created_at
          )
        )
      `)
      .order('order_index', { ascending: true })
      .order('order_index', { ascending: true, foreignTable: 'topics' });

    if (error) {
      throw new RepositoryError(`Database error: ${error.message}`, error, 'getChapters');
    }

    return data;
  }

  // ---- Admin write operations (chapters / topics / videos) ----

  static async nextOrderIndex(table, filter = {}) {
    const supabase = getServiceSupabase();
    let q = supabase.from(table).select('order_index').order('order_index', { ascending: false }).limit(1);
    for (const [k, v] of Object.entries(filter)) q = q.eq(k, v);
    const { data } = await q;
    return (data && data[0] ? data[0].order_index : 0) + 1;
  }

  static async createChapter({ title }) {
    const supabase = getServiceSupabase();
    const order_index = await this.nextOrderIndex('chapters');
    const { data, error } = await supabase
      .from('chapters')
      .insert({ title, order_index, is_published: true })
      .select()
      .single();
    if (error) throw new RepositoryError(error.message, error, 'createChapter');
    return data;
  }

  static async updateChapter(id, patch) {
    const supabase = getServiceSupabase();
    const allowed = {};
    if (patch.title !== undefined) allowed.title = patch.title;
    if (patch.description !== undefined) allowed.description = patch.description;
    if (patch.is_published !== undefined) allowed.is_published = patch.is_published;
    if (patch.is_free !== undefined) allowed.is_free = patch.is_free;
    const { data, error } = await supabase.from('chapters').update(allowed).eq('id', id).select().single();
    if (error) throw new RepositoryError(error.message, error, 'updateChapter');
    return data;
  }

  static async deleteChapter(id) {
    const supabase = getServiceSupabase();
    const { error } = await supabase.from('chapters').delete().eq('id', id);
    if (error) throw new RepositoryError(error.message, error, 'deleteChapter');
    return { id };
  }

  // Update order_index of each row to match its position in orderedIds.
  static async reorder(table, orderedIds) {
    const supabase = getServiceSupabase();
    const results = await Promise.all(
      orderedIds.map((id, idx) =>
        supabase.from(table).update({ order_index: idx + 1 }).eq('id', id)
      )
    );
    const failed = results.find(r => r.error);
    if (failed) throw new RepositoryError(failed.error.message, failed.error, `reorder:${table}`);
    return { ok: true };
  }

  static async createTopic({ chapter_id, title, is_free = false }) {
    const supabase = getServiceSupabase();
    const order_index = await this.nextOrderIndex('topics', { chapter_id });
    const { data, error } = await supabase
      .from('topics')
      .insert({ chapter_id, title, is_free, order_index })
      .select()
      .single();
    if (error) throw new RepositoryError(error.message, error, 'createTopic');
    return data;
  }

  static async updateTopic(id, patch) {
    const supabase = getServiceSupabase();
    const allowed = {};
    if (patch.title !== undefined) allowed.title = patch.title;
    if (patch.is_free !== undefined) allowed.is_free = patch.is_free;
    const { data, error } = await supabase.from('topics').update(allowed).eq('id', id).select().single();
    if (error) throw new RepositoryError(error.message, error, 'updateTopic');
    return data;
  }

  static async deleteTopic(id) {
    const supabase = getServiceSupabase();
    const { error } = await supabase.from('topics').delete().eq('id', id);
    if (error) throw new RepositoryError(error.message, error, 'deleteTopic');
    return { id };
  }

  static async addVideo({ topic_id, youtube_video_id, title }) {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('youtubes')
      .insert({ topic_id, youtube_video_id, title })
      .select()
      .single();
    if (error) throw new RepositoryError(error.message, error, 'addVideo');
    return data;
  }

  static async updateVideo(id, patch) {
    const supabase = getServiceSupabase();
    const allowed = {};
    if (patch.title !== undefined) allowed.title = patch.title;
    if (patch.youtube_video_id !== undefined) allowed.youtube_video_id = patch.youtube_video_id;
    const { data, error } = await supabase.from('youtubes').update(allowed).eq('id', id).select().single();
    if (error) throw new RepositoryError(error.message, error, 'updateVideo');
    return data;
  }

  static async deleteVideo(id) {
    const supabase = getServiceSupabase();
    const { error } = await supabase.from('youtubes').delete().eq('id', id);
    if (error) throw new RepositoryError(error.message, error, 'deleteVideo');
    return { id };
  }

  static async getStudyData(userId) {
    const supabase = getServiceSupabase();

    // Get first day of current month
    const now = new Date();
    const firstDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const lastDay = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59));
    
    const { data, error } = await supabase
      .from('test_attempts')
      .select('time_taken_seconds, completed_at')
      .eq('profile_id', userId)
      .gte('completed_at', firstDay.toISOString())
      .lte('completed_at', lastDay.toISOString());

    if (error) {
      throw new RepositoryError(`Database error: ${error.message}`, error, 'getStudyData');
    }

    const aggregated = {};
    (data || []).forEach((attempt) => {
      const date = new Date(attempt.completed_at);
      const day = date.getDate();
      if (!aggregated[day]) {
        aggregated[day] = { type: "warm", minutes: 0, lessons: 0, tests: 0 };
      }
      aggregated[day].minutes += Math.round((attempt.time_taken_seconds || 0) / 60);
      aggregated[day].tests += 1;
      
      // Upgrade to hot if over 60 mins
      if (aggregated[day].minutes >= 60) {
        aggregated[day].type = "hot";
      }
    });

    return aggregated;
  }
}
