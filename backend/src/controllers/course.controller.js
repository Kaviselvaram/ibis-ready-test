import { CourseService } from "../services/CourseService.js";
import { AppError } from "../errors/AppError.js";

export const getChapters = async ({ user }) => {
  return await CourseService.getChapters(user?.sub);
};

export const getStudyData = async ({ user }) => {
  return await CourseService.getStudyData(user?.sub);
};

// ---- Admin CRUD (roles enforced at route level) ----
export const createChapter = async ({ validatedData }) =>
  await CourseService.createChapter(validatedData);

export const updateChapter = async ({ req, validatedData }) =>
  await CourseService.updateChapter(req.params.id, validatedData);

export const deleteChapter = async ({ req }) =>
  await CourseService.deleteChapter(req.params.id);

export const reorderChapters = async ({ validatedData }) =>
  await CourseService.reorderChapters(validatedData.orderedIds);

export const createTopic = async ({ validatedData }) =>
  await CourseService.createTopic(validatedData);

export const updateTopic = async ({ req, validatedData }) =>
  await CourseService.updateTopic(req.params.id, validatedData);

export const deleteTopic = async ({ req }) =>
  await CourseService.deleteTopic(req.params.id);

export const reorderTopics = async ({ validatedData }) =>
  await CourseService.reorderTopics(validatedData.orderedIds);

export const addVideo = async ({ validatedData }) => {
  try {
    return await CourseService.addVideo(validatedData);
  } catch (e) {
    if (e.statusCode === 400) throw new AppError(e.message, 400, "BAD_INPUT");
    throw e;
  }
};

export const updateVideo = async ({ req, validatedData }) => {
  try {
    return await CourseService.updateVideo(req.params.id, validatedData);
  } catch (e) {
    if (e.statusCode === 400) throw new AppError(e.message, 400, "BAD_INPUT");
    throw e;
  }
};

export const deleteVideo = async ({ req }) =>
  await CourseService.deleteVideo(req.params.id);

export const addNote = async ({ validatedData }) =>
  await CourseService.addNote(validatedData);

export const deleteNote = async ({ req }) =>
  await CourseService.deleteNote(req.params.id);
