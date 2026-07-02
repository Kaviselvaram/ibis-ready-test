import { useCallback, useEffect } from "react";
import { useCourseContext } from "../contexts/CourseContext";
import { CourseRepository } from "../repositories/CourseRepository";

export function reorder(items, index, direction) {
  const next = [...items];
  const target = index + direction;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/**
 * Shared course-content CRUD for the admin drill-down routes
 * (/admin/content → :chapterId → :topicId). Wraps CourseRepository and keeps
 * the CourseContext tree in sync — every mutation refetches the canonical tree.
 */
export function useContentAdmin() {
  const { chapters, setChapters } = useCourseContext();

  useEffect(() => {
    if (chapters.length === 0) {
      CourseRepository.getChapters().then((data) => setChapters(data || [])).catch(console.error);
    }
  }, [chapters.length, setChapters]);

  const refresh = useCallback(async () => {
    try {
      const data = await CourseRepository.getChapters();
      setChapters(data || []);
    } catch (e) { console.error("Failed to refresh chapters:", e); }
  }, [setChapters]);

  // Optimistic in-topic edits (used by the video/notes editors before persist).
  const updateTopic = useCallback((chapterId, topicId, updater) => {
    setChapters((items) => items.map((item) => item.id !== chapterId ? item : ({
      ...item,
      topics: item.topics.map((t) => t.id === topicId ? updater(t) : t)
    })));
  }, [setChapters]);

  // ---- Chapters ----
  const addChapter = useCallback(async (name) => {
    const title = (name || "").trim();
    if (!title) return;
    try { await CourseRepository.createChapter(title); await refresh(); }
    catch (e) { console.error("Add chapter failed:", e); }
  }, [refresh]);

  const renameChapter = useCallback(async (id, name) => {
    const title = (name || "").trim();
    if (!title) return;
    try { await CourseRepository.updateChapter(id, { title }); await refresh(); }
    catch (e) { console.error("Rename chapter failed:", e); }
  }, [refresh]);

  const deleteChapter = useCallback(async (id) => {
    try { await CourseRepository.deleteChapter(id); await refresh(); }
    catch (e) { console.error("Delete chapter failed:", e); }
  }, [refresh]);

  const moveChapter = useCallback(async (list, index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const ordered = reorder(list, index, direction).map((c) => c.id);
    try { await CourseRepository.reorderChapters(ordered); await refresh(); }
    catch (e) { console.error("Reorder chapters failed:", e); }
  }, [refresh]);

  const setChapterFree = useCallback(async (id, isFree) => {
    try { await CourseRepository.updateChapter(id, { is_free: isFree }); await refresh(); }
    catch (e) { console.error("Toggle chapter free failed:", e); }
  }, [refresh]);

  const setChapterPublished = useCallback(async (id, isPublished) => {
    try { await CourseRepository.updateChapter(id, { is_published: isPublished }); await refresh(); }
    catch (e) { console.error("Toggle chapter published failed:", e); }
  }, [refresh]);

  // ---- Topics ----
  const addTopic = useCallback(async (chapterId, name) => {
    const title = (name || "").trim();
    if (!title || !chapterId) return;
    try { await CourseRepository.createTopic({ chapter_id: chapterId, title }); await refresh(); }
    catch (e) { console.error("Add topic failed:", e); }
  }, [refresh]);

  const renameTopic = useCallback(async (id, name) => {
    const title = (name || "").trim();
    if (!title) return;
    try { await CourseRepository.updateTopic(id, { title }); await refresh(); }
    catch (e) { console.error("Rename topic failed:", e); }
  }, [refresh]);

  const deleteTopic = useCallback(async (topicId) => {
    try { await CourseRepository.deleteTopic(topicId); await refresh(); }
    catch (e) { console.error("Delete topic failed:", e); }
  }, [refresh]);

  const moveTopic = useCallback(async (topics, index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= topics.length) return;
    const ordered = reorder(topics, index, direction).map((t) => t.id);
    try { await CourseRepository.reorderTopics(ordered); await refresh(); }
    catch (e) { console.error("Reorder topics failed:", e); }
  }, [refresh]);

  const setTopicFree = useCallback(async (id, isFree) => {
    try { await CourseRepository.updateTopic(id, { is_free: isFree }); await refresh(); }
    catch (e) { console.error("Toggle topic free failed:", e); }
  }, [refresh]);

  // ---- Videos (youtubes) ----
  const addVideo = useCallback(async (topicId, url, title) => {
    try { await CourseRepository.addVideo({ topic_id: topicId, url, title }); await refresh(); }
    catch (e) { console.error("Add video failed:", e); }
  }, [refresh]);

  const deleteVideo = useCallback(async (videoId) => {
    try { await CourseRepository.deleteVideo(videoId); await refresh(); }
    catch (e) { console.error("Delete video failed:", e); }
  }, [refresh]);

  return {
    chapters, refresh, updateTopic,
    addChapter, renameChapter, deleteChapter, moveChapter, setChapterFree, setChapterPublished,
    addTopic, renameTopic, deleteTopic, moveTopic, setTopicFree,
    addVideo, deleteVideo
  };
}
