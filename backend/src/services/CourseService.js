import { CourseRepository } from "../repositories/CourseRepository.js";
import { legacyChapters } from "../utils/legacyCourseData.js";

export class CourseService {
  static async getChapters(userId) {
    try {
      const chapters = await CourseRepository.getChapters(userId);
      
      if (!chapters || chapters.length === 0) {
        return legacyChapters;
      }
      
      // Map DB schema to UI expected schema
      return chapters.map(ch => ({
        id: ch.id,
        name: ch.title,
        image: `/ibis-assets/hero-section-morphing-images/ch0${ch.order_index}_dummy.webp`, // Placeholder asset mapper
        progress: 0, // Compute from user test_attempts if context allows
        topics: (ch.topics || []).map(t => ({
          id: t.id,
          name: t.title,
          isFree: t.is_free,
          testReady: true,
          videos: (t.youtubes || []).map((v, i) => ({
            id: v.id,
            label: i === 0 ? "Concept Core" : "Numerical Sprint",
            title: v.title,
            url: `https://youtube.com/watch?v=${v.youtube_video_id}`,
            duration: "15 min"
          })),
          examples: (t.media || []).filter(m => m.media_type === 'example').map(m => ({
            id: m.id,
            label: "Worked Example",
            title: m.title,
            url: m.r2_object_key,
            duration: "10 min"
          })),
          notes: (t.media || []).filter(m => m.media_type === 'note' || m.media_type === 'pdf').map(m => ({
            id: m.id,
            title: m.title,
            type: m.media_type === 'pdf' ? 'pdf' : 'latex',
            content: "See PDF/Latex in storage",
            url: m.r2_object_key
          }))
        }))
      }));
    } catch (e) {
      throw new Error(`CourseService.getChapters failed: ${e.message}`);
    }
  }

  static async getStudyData(userId) {
    try {
      return await CourseRepository.getStudyData(userId);
    } catch (e) {
      throw new Error(`CourseService.getStudyData failed: ${e.message}`);
    }
  }
}
