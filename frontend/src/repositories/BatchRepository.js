import { api } from '../api/ApiClient';

export const BatchRepository = {
  getBatches: async () => {
    return await api.get('/batch');
  },
  saveBatches: async (batches) => {
    await api.post('/batch', batches);
    return true;
  }
};
