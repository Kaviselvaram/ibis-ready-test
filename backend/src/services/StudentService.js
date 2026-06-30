import { StudentRepository } from "../repositories/StudentRepository.js";

export class StudentService {
  static async getStudents() {
    try {
      const { profiles, subscriptions, test_attempts } = await StudentRepository.getStudents();
      
      const subMap = (subscriptions || []).reduce((acc, sub) => {
        acc[sub.profile_id] = sub;
        return acc;
      }, {});

      const statsMap = (test_attempts || []).reduce((acc, att) => {
        if (!acc[att.profile_id]) acc[att.profile_id] = { totalScore: 0, count: 0 };
        acc[att.profile_id].totalScore += parseFloat(att.score);
        acc[att.profile_id].count += 1;
        return acc;
      }, {});

      return (profiles || []).map(p => {
        const sub = subMap[p.id];
        let access = 'trial';
        let paymentStatus = 'Trial';
        
        if (sub) {
          if (sub.status === 'active') {
            access = 'full';
            paymentStatus = 'Paid';
          } else if (sub.status === 'expired') {
            paymentStatus = 'Unpaid';
          }
        }
        
        const stats = statsMap[p.id] || { totalScore: 0, count: 0 };
        const avgScore = stats.count > 0 ? Math.round(stats.totalScore / stats.count) : 0;

        return {
          id: p.id,
          name: p.full_name || '',
          email: p.email,
          phone: p.phone || '',
          school: p.school || '',
          grade: p.grade || 'Class 12',
          batchCode: p.batches ? p.batches.code : '',
          access,
          paymentStatus,
          joinDate: p.created_at.split('T')[0],
          lastActive: 'Just now',
          studyTimeHrs: 0,
          accuracy: avgScore,
          avgScore: avgScore,
          rank: 0,
          testsTaken: stats.count,
          badges: 0,
          notesUnlocked: access === 'full',
          progress: [],
          testHistory: []
        };
      });
    } catch (e) {
      throw new Error(`StudentService.getStudents failed: ${e.message}`);
    }
  }

  static async saveStudents(students) {
    try {
      return await StudentRepository.saveStudents(students);
    } catch (e) {
      throw new Error(`StudentService.saveStudents failed: ${e.message}`);
    }
  }

  static async getLeaderboard(userId) {
    try {
      const { profiles, attempts } = await StudentRepository.getLeaderboard(userId);
      
      const statsMap = (attempts || []).reduce((acc, att) => {
        if (!acc[att.profile_id]) acc[att.profile_id] = { totalScore: 0, count: 0, timeTaken: 0, badges: 0 };
        acc[att.profile_id].totalScore += parseFloat(att.score);
        acc[att.profile_id].count += 1;
        acc[att.profile_id].timeTaken += (att.time_taken_seconds || 0);
        // Mock a badge calculation (e.g. 1 badge for every 3 tests taken)
        acc[att.profile_id].badges = Math.floor(acc[att.profile_id].count / 3);
        return acc;
      }, {});

      const leaderboard = (profiles || []).map(p => {
        const stats = statsMap[p.id] || { totalScore: 0, count: 0, timeTaken: 0, badges: 0 };
        const avgScore = stats.count > 0 ? Math.round(stats.totalScore / stats.count) : 0;
        const hrs = Math.floor(stats.timeTaken / 3600);
        const mins = Math.floor((stats.timeTaken % 3600) / 60);
        const studyTime = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

        return {
          id: p.id,
          name: p.full_name || 'Anonymous',
          studyTime: stats.timeTaken === 0 ? "0m" : studyTime,
          accuracy: `${avgScore}%`,
          score: avgScore.toString(),
          badges: stats.badges,
          active: "Recently", // A real app would use last sign-in
          isMe: p.id === userId,
          rawScore: avgScore * stats.count // for sorting
        };
      });

      // Sort by rawScore descending
      leaderboard.sort((a, b) => b.rawScore - a.rawScore);

      // Assign ranks
      return leaderboard.map((student, index) => {
        student.rank = index + 1;
        delete student.rawScore;
        return student;
      });
    } catch (e) {
      throw new Error(`StudentService.getLeaderboard failed: ${e.message}`);
    }
  }
}
