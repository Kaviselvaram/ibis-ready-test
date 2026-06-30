import { StudentResponse } from "../../../shared/contracts/v1/student/student.dto.js";

import { StudentService } from "../services/StudentService.js";

export const getStudents = async () => {
  return await StudentService.getStudents();
};

export const saveStudents = async ({ validatedData }) => {
  await StudentService.saveStudents(validatedData);
  return { success: true };
};

export const getLeaderboard = async ({ req }) => {
  return await StudentService.getLeaderboard(req.user.sub);
};
