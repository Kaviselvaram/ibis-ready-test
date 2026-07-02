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
}
