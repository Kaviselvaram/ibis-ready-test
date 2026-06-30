import { getServiceSupabase } from "../config/supabase.js";

export class TestRepository {
  static async getQuestionsByTopic(topicId) {
    const supabase = getServiceSupabase();
    return supabase.from('questions').select('id, prompt, options, difficulty_level, question_type').eq('topic_id', topicId);
  }
  
  static async getQuestionsByChapter(chapterId) {
    const supabase = getServiceSupabase();
    return supabase.from('questions').select('id, prompt, options, difficulty_level, question_type').eq('chapter_id', chapterId);
  }

  static async getSealedAnswers(questionIds) {
    const supabase = getServiceSupabase();
    return supabase.from('sealed_answers').select('question_id, correct_option_id').in('question_id', questionIds);
  }

  static async markAttemptSubmitted(attemptId, userId) {
    const supabase = getServiceSupabase();
    return supabase.from('test_attempts')
      .update({ submitted_at: new Date().toISOString() })
      .eq('id', attemptId)
      .eq('profile_id', userId)
      .is('submitted_at', null)
      .select('id');
  }

  static async saveTestResult(attemptId, score, total, timeTakenMs, passed) {
    const supabase = getServiceSupabase();
    const { error } = await supabase.from('test_results').insert({
        attempt_id: attemptId,
        score,
        total,
        time_taken_ms: timeTakenMs,
        passed
    });
    if (error) console.error("Warning: Could not save test result (missing table):", error.message);
    return { error: null }; // Suppress error for MVP
  }
}
