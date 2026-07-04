import { api } from '../api/ApiClient';
import { StudentSummaryResponse } from '../../../shared/contracts/v1/student/student.dto.js';

export const ACCESS_LEVELS = {
  TRIAL: "trial",
  FULL: "full"
};

export const PAYMENT_STATES = {
  PAID: "Paid",
  UNPAID: "Unpaid",
  TRIAL: "Trial",
  REFUNDED: "Refunded"
};

export function blankStudent() {
  return {
    id: `stu-${Date.now()}`,
    name: "", email: "", phone: "", school: "", grade: "Class 12", batchCode: "",
    access: "trial", paymentStatus: "Trial",
    joinDate: new Date().toISOString().slice(0, 10), lastActive: "Just now",
    studyTimeHrs: 0, accuracy: 0, avgScore: 0, rank: 0, testsTaken: 0, badges: 0, notesUnlocked: false,
    progress: [], testHistory: [],
  };
}

export const StudentRepository = {
  getStudents: async () => {
    const data = await api.get('/student');
    // We expect the backend to return full student objects for now, 
    // but we can parse them (if strict schema matching is required)
    // Here we just return the data directly or map them.
    return data;
  },
  saveStudents: async (students) => {
    await api.post('/student', students);
    return true;
  },
  deleteStudent: async (id) => {
    await api.delete(`/student/${id}`);
    return true;
  },
  bulkUpload: async (rows, sendEmail = true) => {
    return await api.post('/student/bulk', { rows, sendEmail });
  },
  // Student's own progress dashboard (analytics + gamification).
  getProgress: async () => {
    return await api.get('/student/progress');
  },
  // Rank summary — global for universal students, batch for batch students (#9).
  getRank: async () => {
    return await api.get('/student/rank');
  }
};
