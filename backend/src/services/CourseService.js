import { CourseRepository } from "../repositories/CourseRepository.js";
import { cached, invalidate, CACHE_KEYS } from "../utils/cache.js";

// Real chapter cover assets (served from /public/ibis-assets). Keyed by a
// normalized chapter title. Interim mapping until chapters gain an `image_url`
// column the admin can set directly.
const IMAGE_BASE = "/ibis-assets/hero-section-morphing-images";
const CHAPTER_IMAGES = {
  "electric charges and fields": "ch01_electric_charges_and_fields_48837919.webp",
  "electrostatic potential and capacitance": "ch02_electrostatic_potential_and_capacitance_390148e1.webp",
  "current electricity": "ch03_current_electricity_820757da.webp",
  "moving charges and magnetism": "ch04_moving_charges_and_magnetism_473c230b.webp",
  "magnetism and matter": "ch05_magnetism_and_matter_1537fa81.webp",
  "electromagnetic induction": "ch06_electromagnetic_induction_4e4d7cfe.webp",
  "alternating current": "ch07_alternating_current_f6a9a19c.webp",
  "electromagnetic waves": "ch08_electromagnetic_waves_51e1e7f1.webp",
  "ray optics and optical instruments": "ch09_ray_optics_44fe5bb9.webp",
  "wave optics": "ch10_wave_optics_ac864eca.webp",
  "dual nature of radiation and matter": "ch11_dual_nature_radiation_matter_b49ee0da.webp",
  "atoms": "ch12_atoms_1bc9a982.webp",
  "nuclei": "ch13_nuclei_497a4db2.webp",
  "semiconductors": "ch14_semiconductors_9a28fd51.webp"
};
const IMAGE_LIST = Object.values(CHAPTER_IMAGES);

function chapterImage(title, orderIndex) {
  const key = String(title || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const file = CHAPTER_IMAGES[key] || IMAGE_LIST[((orderIndex || 1) - 1) % IMAGE_LIST.length];
  return `${IMAGE_BASE}/${file}`;
}

export class CourseService {
  static async getChapters(userId) {
    // The mapped tree is identical for every viewer (progress is computed
    // client-side), so it is cached globally with a short TTL backstop and
    // explicitly invalidated on every admin write below.
    return cached(CACHE_KEYS.courseTree, 300, () => CourseService._buildChapters(userId));
  }

  static async _buildChapters(userId) {
    try {
      const chapters = await CourseRepository.getChapters(userId);

      if (!chapters || chapters.length === 0) {
        return []; // Real data only — no fabricated fallback content.
      }

      // Map DB schema to UI expected schema
      return chapters.map(ch => ({
        id: ch.id,
        name: ch.title,
        image: chapterImage(ch.title, ch.order_index),
        isFree: ch.is_free === true,
        isPublished: ch.is_published === true,
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
            // Send only the bare video id — the client builds a privacy-enhanced
            // nocookie embed from it, so no ready-made youtube.com link ships in the DOM.
            url: v.youtube_video_id,
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
            type: 'pdf',
            content: "See PDF in storage",
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

  // Accepts a full YouTube URL or a bare 11-char video id; returns the id.
  static extractYouTubeId(input) {
    if (!input) return null;
    const str = String(input).trim();
    const patterns = [
      /(?:youtube\.com\/.*[?&]v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
      /^([A-Za-z0-9_-]{11})$/
    ];
    for (const re of patterns) {
      const m = str.match(re);
      if (m) return m[1];
    }
    return null;
  }

  // ---- Admin CRUD (chapters / topics / videos) ----
  // Every mutation invalidates the cached course tree so students see changes
  // on their next fetch (and instantly via the realtime channel).
  static async _write(promise) {
    const result = await promise;
    await invalidate(CACHE_KEYS.courseTree);
    return result;
  }

  static createChapter({ title }) { return CourseService._write(CourseRepository.createChapter({ title })); }
  static updateChapter(id, patch) { return CourseService._write(CourseRepository.updateChapter(id, patch)); }
  static deleteChapter(id) { return CourseService._write(CourseRepository.deleteChapter(id)); }
  static reorderChapters(orderedIds) { return CourseService._write(CourseRepository.reorder('chapters', orderedIds)); }

  static createTopic(payload) { return CourseService._write(CourseRepository.createTopic(payload)); }
  static updateTopic(id, patch) { return CourseService._write(CourseRepository.updateTopic(id, patch)); }
  static deleteTopic(id) { return CourseService._write(CourseRepository.deleteTopic(id)); }
  static reorderTopics(orderedIds) { return CourseService._write(CourseRepository.reorder('topics', orderedIds)); }

  static addVideo({ topic_id, url, title }) {
    const youtube_video_id = CourseService.extractYouTubeId(url);
    if (!youtube_video_id) {
      const err = new Error("Invalid YouTube URL or video id");
      err.statusCode = 400;
      throw err;
    }
    return CourseService._write(CourseRepository.addVideo({ topic_id, youtube_video_id, title: title || "New lesson" }));
  }
  static updateVideo(id, { title, url }) {
    const patch = {};
    if (title !== undefined) patch.title = title;
    if (url !== undefined) {
      const youtube_video_id = CourseService.extractYouTubeId(url);
      if (!youtube_video_id) {
        const err = new Error("Invalid YouTube URL or video id");
        err.statusCode = 400;
        throw err;
      }
      patch.youtube_video_id = youtube_video_id;
    }
    return CourseService._write(CourseRepository.updateVideo(id, patch));
  }
  static deleteVideo(id) { return CourseService._write(CourseRepository.deleteVideo(id)); }
}
