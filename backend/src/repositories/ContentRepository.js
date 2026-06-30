import { getServiceSupabase } from "../config/supabase.js";

export class ContentRepository {
  static async getMedia(contentId) {
    const supabase = getServiceSupabase();
    return supabase.from('media').select('r2_object_key').eq('id', contentId).single();
  }

  static async getVideoByTopicId(topicId) {
    const supabase = getServiceSupabase();
    return supabase.from('videos').select('*').eq('topic_id', topicId).single();
  }
}
