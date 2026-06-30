import { getServiceSupabase } from "../config/supabase.js";
import { RepositoryError } from "../errors/RepositoryError.js";

export class CourseRepository {
  static async getChapters(userId) {
    const supabase = getServiceSupabase();
    
    const { data, error } = await supabase
      .from('chapters')
      .select(`
        id, title, description, order_index, is_published, created_at,
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
