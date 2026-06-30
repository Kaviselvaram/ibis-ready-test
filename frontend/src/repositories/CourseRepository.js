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
  }
};
