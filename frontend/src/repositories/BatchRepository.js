import { api } from '../api/ApiClient';

export const BatchRepository = {
  getBatches: async () => {
    return await api.get('/batch');
  },
  saveBatches: async (batches) => {
    await api.post('/batch', batches);
    return true;
  },
  deleteBatch: async (id) => {
    await api.delete(`/batch/${id}`);
    return true;
  },
  // On-demand — only called when an admin opens a batch's analytics page.
  getBatchAnalytics: async (id) => {
    return await api.get(`/batch/${id}/analytics`);
  }
};
