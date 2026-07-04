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

  // Bulk-create students from parsed CSV rows. For each row we create a real
  // Supabase auth user with a generated temp password, ensure a profile, and
  // attach phone/grade/batch. Returns a per-row result carrying the temp
  // password so the caller can hand back a credentials CSV (and email it).
  static async bulkCreate(rows) {
    const supabase = getServiceSupabase();

    // Resolve batch codes → ids once up front.
    const codes = [...new Set(rows.map((r) => (r.batch_code || "").trim()).filter(Boolean))];
    const batchByCode = {};
    if (codes.length) {
      const { data: batches } = await supabase.from('batches').select('id, code').in('code', codes);
      (batches || []).forEach((b) => { batchByCode[b.code] = b.id; });
    }

    const results = [];
    const seenInBatch = new Set(); // in-file duplicate detection (#12)
    for (const row of rows) {
      const email = (row.email || "").trim().toLowerCase();
      const name = (row.full_name || "").trim();
      const entry = { email, name, status: "created", password: null, error: null };

      if (!email) { entry.status = "error"; entry.error = "Missing email"; results.push(entry); continue; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { entry.status = "error"; entry.error = "Invalid email"; results.push(entry); continue; }
      if (seenInBatch.has(email)) { entry.status = "skipped"; entry.error = "Duplicate in import"; results.push(entry); continue; }
      seenInBatch.add(email);

      const password = StudentRepository._tempPassword();
      try {
        const { data, error } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: name }
        });
        if (error) {
          entry.status = "skipped";
          entry.error = /already/i.test(error.message) ? "Email already registered" : error.message;
          results.push(entry);
          continue;
        }

        const batchId = batchByCode[(row.batch_code || "").trim()] || null;
        const profilePatch = {
          id: data.user.id,
          email,
          full_name: name || null,
          is_admin: false,
          phone: (row.phone || "").trim() || null,
          grade: (row.grade || "").trim() || null
        };
        if (batchId) profilePatch.batch_id = batchId;

        const { error: pErr } = await supabase.from('profiles').upsert(profilePatch, { onConflict: 'id' });
        if (pErr) console.error(`Bulk profile upsert failed for ${email}:`, pErr.message);

        entry.password = password;
        results.push(entry);
      } catch (e) {
        entry.status = "error";
        entry.error = e.message;
        results.push(entry);
      }
    }
    return results;
  }

  // Readable, policy-safe temp password: Ibis-XXXXXX (letters+digits).
  static _tempPassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnpqrstuvwxyz";
    let s = "";
    for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return `Ibis-${s}`;
  }

  // Permanently remove a student. Deleting the auth user cascades to the
  // profile (and its subscriptions/attempts via FK), so this is the single
  // source-of-truth deletion. Guard against removing an admin account.
  static async deleteStudent(id) {
    const supabase = getServiceSupabase();

    const { data: profile, error: pErr } = await supabase
      .from('profiles').select('id, is_admin').eq('id', id).single();
    if (pErr) throw new RepositoryError(`Student not found: ${pErr.message}`, pErr, 'deleteStudent.lookup');
    if (profile.is_admin) throw new RepositoryError('Refusing to delete an admin account', null, 'deleteStudent.admin');

    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) throw new RepositoryError(`Auth delete failed: ${error.message}`, error, 'deleteStudent.auth');
    return { id };
  }

  // A student's attempts with their stored reports — drives the progress
  // dashboard (per-chapter mastery, Bloom analysis, streaks, gamification).
  static async getAttemptsForProgress(profileId) {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('test_attempts')
      .select('title, test_type, score, total, correct, wrong, skipped, time_taken_seconds, completed_at, report')
      .eq('profile_id', profileId)
      .order('completed_at', { ascending: false })
      .limit(300);
    if (error) throw new RepositoryError(error.message, error, 'getAttemptsForProgress');
    return data || [];
  }

  // Look up which batch (if any) a student belongs to — drives batch-scoped
  // rankings. Returns the batch_id or null.
  static async getUserBatchId(userId) {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase.from('profiles').select('batch_id').eq('id', userId).single();
    if (error) return null;
    return data?.batch_id || null;
  }

  // The user's batch {id,name} or null for universal (batch-less) students.
  // Drives the global-vs-batch rank separation (#9).
  static async getUserBatch(userId) {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .select('batch_id, batches ( id, name )')
      .eq('id', userId)
      .single();
    if (error || !data?.batch_id) return null;
    return { id: data.batch_id, name: data.batches?.name || null };
  }

  // Leaderboard source rows. When batchId is given, only that batch's students
  // are included (batch-scoped ranking); otherwise the whole cohort.
  static async getLeaderboard(batchId = null) {
    const supabase = getServiceSupabase();

    let q = supabase.from('profiles').select('id, full_name').neq('is_admin', true);
    if (batchId) q = q.eq('batch_id', batchId);
    const { data: profiles, error: pError } = await q;
    if (pError) throw new RepositoryError(pError.message, pError, 'getLeaderboard.profiles');

    const ids = (profiles || []).map((p) => p.id);
    let attempts = [];
    if (!batchId || ids.length) {
      let aq = supabase.from('test_attempts').select('profile_id, score, time_taken_seconds');
      if (batchId) aq = aq.in('profile_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
      const { data, error: aError } = await aq;
      if (aError) throw new RepositoryError(aError.message, aError, 'getLeaderboard.test_attempts');
      attempts = data || [];
    }

    return { profiles, attempts };
  }
}
