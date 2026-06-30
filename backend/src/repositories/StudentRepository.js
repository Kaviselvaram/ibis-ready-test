import { getServiceSupabase } from "../config/supabase.js";
import { RepositoryError } from "../errors/RepositoryError.js";

export class StudentRepository {
  static async getStudents() {
    const supabase = getServiceSupabase();
    
    // Fetch raw profiles
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select(`
        id, email, full_name, created_at, updated_at,
        batches ( code )
      `)
      .neq('is_admin', true);
    if (pError) throw new RepositoryError(`Database error: ${pError.message}`, pError, 'getStudents.profiles');

    // Fetch raw subscriptions
    const { data: subscriptions, error: sError } = await supabase
      .from('subscriptions')
      .select('profile_id, status');
    if (sError) throw new RepositoryError(sError.message, sError, 'getStudents.subscriptions');

    // Fetch raw attempts
    const { data: test_attempts, error: aError } = await supabase
      .from('test_attempts')
      .select('profile_id, score');
    if (aError) throw new RepositoryError(aError.message, aError, 'getStudents.test_attempts');

    return { profiles, subscriptions, test_attempts };
  }

  static async saveStudents(students) {
    const supabase = getServiceSupabase();
    
    // The frontend UI for saveStudents just saves the whole list of students.
    // However, in a real system we would create auth users for new students.
    // For Phase 4.3 persistence layer mapping without altering business logic,
    // we assume the UI updates existing profiles or we skip creation here since
    // user creation must go through Supabase Auth.
    // If there are new mock students (e.g. from the seed), we might not be able to 
    // insert them directly into `profiles` because they need an Auth user first.
    // We will update the ones that match existing profiles.
    
    for (const st of students) {
      if (st.id.startsWith('stu-')) {
        // These are faux IDs from the mock. Ignore inserting them as real profiles
        // unless we want to bypass auth. We can't insert into profiles without auth.users.
        continue;
      }
      
      const updateData = {
        full_name: st.name,
        phone: st.phone,
        school: st.school,
        grade: st.grade
      };
      
      if (st.batchCode) {
        const { data: batch } = await supabase.from('batches').select('id').eq('code', st.batchCode).single();
        if (batch) updateData.batch_id = batch.id;
      }
      
      await supabase.from('profiles').update(updateData).eq('id', st.id);
    }
    
    return true;
  }

  static async getLeaderboard(userId) {
    const supabase = getServiceSupabase();
    
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .neq('is_admin', true);
    if (pError) throw new RepositoryError(pError.message, pError, 'getLeaderboard.profiles');

    const { data: attempts, error: aError } = await supabase
      .from('test_attempts')
      .select('profile_id, score, time_taken_seconds');
    if (aError) throw new RepositoryError(aError.message, aError, 'getLeaderboard.test_attempts');

    return { profiles, attempts };
  }
}
