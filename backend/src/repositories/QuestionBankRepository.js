import { getServiceSupabase } from "../config/supabase.js";
import { RepositoryError } from "../errors/RepositoryError.js";
import { DIFFICULTIES } from "../../../shared/contracts/v1/question/QuestionEnums.js";
import crypto from 'crypto';

export class QuestionBankRepository {
  static async getBank() {
    const supabase = getServiceSupabase();
    
    const { data, error } = await supabase
      .from('questions')
      .select(`
        id, prompt, options, difficulty_level, question_type, bloom_level, explanation, source,
        topics (
          title,
          chapters ( title )
        ),
        sealed_answers ( correct_option_id )
      `);
      
    if (error) {
      throw new RepositoryError(`Database error: ${error.message}`, error, 'getBank');
    }

    return data;
  }

  static async getTopicsData() {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('topics')
      .select('id, title, chapter_id, chapters(title)');
      
    if (error) throw new RepositoryError(`Database error: ${error.message}`, error, 'getTopicsData');
    return data;
  }

  static async saveBank(questionsToUpsert, answersToUpsert) {
    const supabase = getServiceSupabase();
    
    if (questionsToUpsert.length > 0) {
      const { error: qError } = await supabase
        .from('questions')
        .upsert(questionsToUpsert);
      if (qError) throw new RepositoryError(qError.message, qError, 'saveBank:questions');
    }

    if (answersToUpsert && answersToUpsert.length > 0) {
      const { error: aError } = await supabase
        .from('sealed_answers')
        .upsert(answersToUpsert);
      if (aError) throw new RepositoryError(aError.message, aError, 'saveBank:answers');
    }

    return true;
  }

  static async upsertChapter(title) {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('chapters')
      .select('id')
      .eq('title', title)
      .maybeSingle();

    if (error) throw new RepositoryError(error.message, error, 'upsertChapter');
    if (data) return data.id;

    const id = crypto.randomUUID();
    const { error: insertError } = await supabase
      .from('chapters')
      .insert({ id, title, order_index: 0 });
      
    if (insertError) throw new RepositoryError(insertError.message, insertError, 'upsertChapter');
    return id;
  }

  static async upsertTopic(chapterId, title) {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('topics')
      .select('id')
      .eq('chapter_id', chapterId)
      .eq('title', title)
      .maybeSingle();

    if (error) throw new RepositoryError(error.message, error, 'upsertTopic');
    if (data) return data.id;

    const id = crypto.randomUUID();
    const { error: insertError } = await supabase
      .from('topics')
      .insert({ id, chapter_id: chapterId, title, order_index: 0 });
      
    if (insertError) throw new RepositoryError(insertError.message, insertError, 'upsertTopic');
    return id;
  }
}
