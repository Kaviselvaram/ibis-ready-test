import { BatchRepository } from "../repositories/BatchRepository.js";

export class BatchService {
  static async getBatches() {
    try {
      const { batches, profiles } = await BatchRepository.getBatches();
      
      const counts = (profiles || []).reduce((acc, profile) => {
        if (profile.batch_id) {
          acc[profile.batch_id] = (acc[profile.batch_id] || 0) + 1;
        }
        return acc;
      }, {});

      return (batches || []).map(b => ({
        id: b.id,
        name: b.name,
        code: b.code,
        school: b.school,
        count: counts[b.id] || 0,
        status: b.status
      }));
    } catch (e) {
      throw new Error(`BatchService.getBatches failed: ${e.message}`);
    }
  }

  static async saveBatches(batches) {
    try {
      return await BatchRepository.saveBatches(batches);
    } catch (e) {
      throw new Error(`BatchService.saveBatches failed: ${e.message}`);
    }
  }

  static async deleteBatch(id) {
    try {
      return await BatchRepository.deleteBatch(id);
    } catch (e) {
      throw new Error(`BatchService.deleteBatch failed: ${e.message}`);
    }
  }

  // Student joins a batch by code. Throws a 400 AppError-style error the
  // controller maps to a clean message when the code is wrong.
  static async joinBatch(userId, code) {
    const clean = String(code || "").trim();
    if (!clean) { const e = new Error("Enter a batch code."); e.statusCode = 400; throw e; }
    const batch = await BatchRepository.joinByCode(userId, clean);
    if (!batch) { const e = new Error("That batch code doesn’t exist. Check it with your teacher."); e.statusCode = 404; throw e; }
    return { id: batch.id, code: batch.code, name: batch.name, school: batch.school, status: batch.status };
  }

  static async getMyBatch(userId) {
    try {
      return await BatchRepository.getMyBatch(userId);
    } catch (e) {
      throw new Error(`BatchService.getMyBatch failed: ${e.message}`);
    }
  }

  // Compute batch analytics + a batch-scoped ranking from raw rows.
  static async getBatchAnalytics(id) {
    try {
      const { batch, profiles, attempts } = await BatchRepository.getBatchAnalytics(id);

      const byStudent = {};
      (attempts || []).forEach((a) => {
        const s = byStudent[a.profile_id] || (byStudent[a.profile_id] = { total: 0, count: 0 });
        s.total += parseFloat(a.score) || 0;
        s.count += 1;
      });

      const ranking = (profiles || []).map((p) => {
        const s = byStudent[p.id] || { total: 0, count: 0 };
        const avg = s.count ? Math.round(s.total / s.count) : 0;
        return { id: p.id, name: p.full_name || "Unnamed", email: p.email, avgScore: avg, tests: s.count };
      }).sort((a, b) => b.avgScore - a.avgScore || b.tests - a.tests)
        .map((r, i) => ({ ...r, rank: i + 1 }));

      const activeStudents = ranking.filter((r) => r.tests > 0).length;
      const totalAttempts = (attempts || []).length;
      const avgScore = totalAttempts
        ? Math.round((attempts.reduce((n, a) => n + (parseFloat(a.score) || 0), 0)) / totalAttempts)
        : 0;

      return {
        batch,
        stats: { students: (profiles || []).length, activeStudents, totalAttempts, avgScore },
        ranking
      };
    } catch (e) {
      throw new Error(`BatchService.getBatchAnalytics failed: ${e.message}`);
    }
  }
}
