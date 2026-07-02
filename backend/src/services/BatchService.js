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
}
