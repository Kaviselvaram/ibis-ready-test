import { getServiceSupabase } from "../config/supabase.js";
import { RepositoryError } from "../errors/RepositoryError.js";

export class BatchRepository {
  static async getBatches() {
    const supabase = getServiceSupabase();
    
    const { data: batches, error } = await supabase
      .from('batches')
      .select('id, code, name, school, created_at');
    
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
    
    // Upsert batches based on 'id' if they have one, or create new ones
    const toUpsert = batches.map(b => ({
      id: b.id.startsWith('b') ? undefined : b.id, // For mock compatibility: ignore 'b1', 'b2' faux IDs if inserting
      code: b.code,
      name: b.name,
      school: b.school,
      status: b.status || 'Active'
    })).map(b => {
      if (!b.id) delete b.id; // Let DB generate uuid
      return b;
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
