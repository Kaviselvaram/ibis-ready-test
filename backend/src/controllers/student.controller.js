import { StudentResponse } from "../../../shared/contracts/v1/student/student.dto.js";

import { StudentService } from "../services/StudentService.js";
import { ProgressService } from "../services/ProgressService.js";

export const getStudents = async () => {
  return await StudentService.getStudents();
};

export const saveStudents = async ({ validatedData }) => {
  await StudentService.saveStudents(validatedData);
  return { success: true };
};

export const deleteStudent = async ({ req }) => {
  await StudentService.deleteStudent(req.params.id);
  return { success: true };
};

export const bulkCreateStudents = async ({ validatedData }) => {
  const { rows, sendEmail } = validatedData;
  return await StudentService.bulkCreateStudents(rows, { sendEmail });
};

export const getLeaderboard = async ({ req }) => {
  return await StudentService.getLeaderboard(req.user.sub);
};

// Global-vs-batch rank separation (#9).
export const getRank = async ({ req }) => {
  return await StudentService.getRankSummary(req.user.sub);
};

export const getProgress = async ({ req }) => {
  return await ProgressService.getProgress(req.user.sub);
};
