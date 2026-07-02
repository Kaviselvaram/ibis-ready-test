import { getServiceSupabase } from "../config/supabase.js";
import { RepositoryError } from "../errors/RepositoryError.js";

export class BatchRepository {
  static async getBatches() {
    const supabase = getServiceSupabase();
    
    const { data: batches, error } = await supabase
      .from('batches')
      .select('id, code, name, school, status, created_at');
    
    if (error) {
      throw new RepositoryError(`Database error: ${error.message}`, error, 'getBatches.batches');
    }
    
    const { data: profiles, error: countError } = await supabase
      .from('profiles')
      .select('batch_id');

    if (countError) throw new RepositoryError(countError.message, countError, 'getBatches.profiles');

    return { batches, profiles };
  }

  static async saveBatches(batches) {
    const supabase = getServiceSupabase();
    
    // Upsert batches. Only keep a valid UUID id (existing rows); anything else
    // — a missing id or a faux/code-based id — is dropped so the DB generates one.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const toUpsert = (batches || []).map(b => {
      const row = {
        code: b.code,
        name: b.name,
        school: b.school,
        status: b.status || 'Active'
      };
      if (typeof b.id === 'string' && UUID_RE.test(b.id)) row.id = b.id;
      return row;
    });

    const { error } = await supabase
      .from('batches')
      .upsert(toUpsert, { onConflict: 'code' }); // Upserting by code to avoid duplicate codes

    if (error) {
      throw new RepositoryError(`Database error: ${error.message}`, error, 'saveBatches');
    }

    return true;
  }

  // Delete a batch. Detach any students first so the delete never fails on a
  // foreign-key reference (and students simply become batch-less).
  static async deleteBatch(id) {
    const supabase = getServiceSupabase();

    const { error: detachError } = await supabase
      .from('profiles').update({ batch_id: null }).eq('batch_id', id);
    if (detachError) throw new RepositoryError(detachError.message, detachError, 'deleteBatch.detach');

    const { error } = await supabase.from('batches').delete().eq('id', id);
    if (error) throw new RepositoryError(error.message, error, 'deleteBatch');
    return { id };
  }

  // Link a student to a batch by its code. Returns the batch, or null when the
  // code doesn't match any batch.
  static async joinByCode(userId, code) {
    const supabase = getServiceSupabase();
    const { data: batch, error } = await supabase
      .from('batches').select('id, code, name, school, status').ilike('code', code).maybeSingle();
    if (error) throw new RepositoryError(error.message, error, 'joinByCode.lookup');
    if (!batch) return null;

    const { error: upErr } = await supabase
      .from('profiles').update({ batch_id: batch.id }).eq('id', userId);
    if (upErr) throw new RepositoryError(upErr.message, upErr, 'joinByCode.update');
    return batch;
  }

  // The batch a given student currently belongs to (or null).
  static async getMyBatch(userId) {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('profiles').select('batch_id, batches ( id, code, name, school, status )').eq('id', userId).single();
    if (error) return null;
    return data?.batches || null;
  }

  // On-demand analytics for a single batch — only queried when an admin opens
  // the batch, never as part of the default batch list.
  static async getBatchAnalytics(id) {
    const supabase = getServiceSupabase();

    const { data: batch, error: bErr } = await supabase
      .from('batches').select('id, code, name, school, status').eq('id', id).single();
    if (bErr) throw new RepositoryError(`Batch not found: ${bErr.message}`, bErr, 'getBatchAnalytics.batch');

    const { data: profiles, error: pErr } = await supabase
      .from('profiles').select('id, full_name, email').eq('batch_id', id);
    if (pErr) throw new RepositoryError(pErr.message, pErr, 'getBatchAnalytics.profiles');

    const ids = (profiles || []).map((p) => p.id);
    let attempts = [];
    if (ids.length) {
      const { data, error: aErr } = await supabase
        .from('test_attempts').select('profile_id, score').in('profile_id', ids);
      if (aErr) throw new RepositoryError(aErr.message, aErr, 'getBatchAnalytics.attempts');
      attempts = data || [];
    }

    return { batch, profiles, attempts };
  }
}
