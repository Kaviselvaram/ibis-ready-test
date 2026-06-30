import { CourseService } from "../services/CourseService.js";

export const getChapters = async ({ user }) => {
  return await CourseService.getChapters(user?.sub);
};

export const getStudyData = async ({ user }) => {
  return await CourseService.getStudyData(user?.sub);
};
