import { api } from '../api/ApiClient';

export const CourseRepository = {
  getChapters: async () => {
    const data = await api.get('/course/chapters');
    return data || [];
  },
  getStudyData: async () => {
    return await api.get('/course/study-data');
  },
  getLeaderboard: async () => {
    return await api.get('/student/leaderboard');
  },
  getPricing: async () => {
    return await api.get('/content/pricing');
  },

  // ---- Admin CRUD (persists to Supabase) ----
  createChapter: (title, image_url = null) => api.post('/course/chapters', { title, image_url }),
  updateChapter: (id, patch) => api.patch(`/course/chapters/${id}`, patch),
  deleteChapter: (id) => api.delete(`/course/chapters/${id}`),
  reorderChapters: (orderedIds) => api.patch('/course/chapters/reorder', { orderedIds }),

  createTopic: (payload) => api.post('/course/topics', payload),
  updateTopic: (id, patch) => api.patch(`/course/topics/${id}`, patch),
  deleteTopic: (id) => api.delete(`/course/topics/${id}`),
  reorderTopics: (orderedIds) => api.patch('/course/topics/reorder', { orderedIds }),

  addVideo: (payload) => api.post('/course/videos', payload),
  updateVideo: (id, patch) => api.patch(`/course/videos/${id}`, patch),
  deleteVideo: (id) => api.delete(`/course/videos/${id}`),

  addNote: (payload) => api.post('/course/notes', payload),
  deleteNote: (id) => api.delete(`/course/notes/${id}`)
};
