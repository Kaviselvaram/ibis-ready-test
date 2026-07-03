import { api } from '../api/ApiClient';

export const TEST_TYPES = [
  { value: 'half_chapter', label: 'Half Chapter' },
  { value: 'full_chapter', label: 'Full Chapter' },
  { value: 'combined', label: 'Combined' },
  { value: 'full_syllabus', label: 'Full Syllabus' }
];

export const testTypeLabel = (value) =>
  TEST_TYPES.find((t) => t.value === value)?.label || value;

export const TestRepository = {
  // Admin
  listTests: () => api.get('/test/manage'),
  createTest: (payload) => api.post('/test/manage', payload),
  updateTest: (id, patch) => api.patch(`/test/manage/${id}`, patch),
  deleteTest: (id) => api.delete(`/test/manage/${id}`),
  // Student
  availableTests: () => api.get('/test/available'),
  startTest: (id) => api.post(`/test/start/${id}`, {}),
  // Student-built practice tests (questions from the admin JSON bank)
  getScope: () => api.get('/test/scope'),
  generatePractice: ({ chapters, topics, count }) => api.post('/test/generate', { chapters, topics, count }),
  evaluatePractice: ({ questions, answers, meta }) => api.post('/test/evaluate', { questions, answers, meta }),
  // History + results (student owns theirs; admin can pass profileId)
  history: (profileId) => api.get(`/test/history${profileId ? `?profileId=${profileId}` : ''}`),
  getResult: (id) => api.get(`/test/result/${id}`)
};
