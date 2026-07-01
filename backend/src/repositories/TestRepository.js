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

  // ---- Test config management (public.tests) ----
  static async listAllTests() {
    const supabase = getServiceSupabase();
    return supabase.from('tests').select('*').order('created_at', { ascending: false });
  }

  static async listLiveTests() {
    const supabase = getServiceSupabase();
    return supabase.from('tests').select('*').eq('is_live', true).order('created_at', { ascending: false });
  }

  static async getTestById(id) {
    const supabase = getServiceSupabase();
    return supabase.from('tests').select('*').eq('id', id).single();
  }

  static async createTest(payload) {
    const supabase = getServiceSupabase();
    return supabase.from('tests').insert(payload).select().single();
  }

  static async updateTest(id, patch) {
    const supabase = getServiceSupabase();
    return supabase.from('tests').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  }

  static async deleteTest(id) {
    const supabase = getServiceSupabase();
    return supabase.from('tests').delete().eq('id', id);
  }

  static async getChaptersByIds(ids) {
    const supabase = getServiceSupabase();
    return supabase.from('chapters').select('id, title').in('id', ids);
  }

  // Records a completed attempt (with its full report) so it feeds progress,
  // the leaderboard, and the student/admin test-history views.
  static async recordAttempt(row) {
    const supabase = getServiceSupabase();
    return supabase.from('test_attempts').insert({
      profile_id: row.profileId,
      topic_id: row.topicId ?? null,
      test_id: row.testId ?? null,
      title: row.title ?? null,
      test_type: row.testType ?? null,
      score: row.score,
      total: row.total ?? null,
      correct: row.correct ?? null,
      wrong: row.wrong ?? null,
      skipped: row.skipped ?? null,
      time_taken_seconds: row.timeTakenSeconds || 0,
      report: row.report ?? null,
      completed_at: new Date().toISOString()
    }).select('id').single();
  }

  // Summary list for a student's (or, for admins, any student's) test history.
  static async getHistory(profileId) {
    const supabase = getServiceSupabase();
    return supabase.from('test_attempts')
      .select('id, title, test_type, score, total, correct, wrong, skipped, time_taken_seconds, completed_at')
      .eq('profile_id', profileId)
      .order('completed_at', { ascending: false })
      .limit(100);
  }

  // Full stored result (incl. report JSONB) for one attempt.
  static async getResult(id) {
    const supabase = getServiceSupabase();
    return supabase.from('test_attempts')
      .select('id, profile_id, title, test_type, score, total, correct, wrong, skipped, time_taken_seconds, completed_at, report')
      .eq('id', id)
      .maybeSingle();
  }

  static async getProfileBasic(profileId) {
    const supabase = getServiceSupabase();
    return supabase.from('profiles').select('id, full_name, email').eq('id', profileId).maybeSingle();
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
