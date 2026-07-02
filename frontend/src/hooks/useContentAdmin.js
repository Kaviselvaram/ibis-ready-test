import { useCallback, useEffect } from "react";
import { useCourseContext } from "../contexts/CourseContext";
import { CourseRepository } from "../repositories/CourseRepository";
import { useToast, friendlyMessage } from "../contexts/ToastContext";

export function reorder(items, index, direction) {
  const next = [...items];
  const target = index + direction;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/**
 * Shared course-content CRUD for the admin drill-down routes
 * (/admin/content → :chapterId → :topicId). Wraps CourseRepository, keeps the
 * CourseContext tree in sync (every mutation refetches the canonical tree), and
 * gives every action loading/success/error toast feedback.
 */
export function useContentAdmin() {
  const { chapters, setChapters } = useCourseContext();
  const toast = useToast();

  useEffect(() => {
    if (chapters.length === 0) {
      CourseRepository.getChapters().then((data) => setChapters(data || [])).catch(console.error);
    }
  }, [chapters.length, setChapters]);

  const refresh = useCallback(async () => {
    const data = await CourseRepository.getChapters();
    setChapters(data || []);
    return data;
  }, [setChapters]);

  // Run a mutation with toast feedback; refetch the tree; swallow at the edge so
  // a rejection never becomes an unhandled promise. Returns true/false.
  const run = useCallback(async (fn, { loading, success, error }) => {
    try {
      await toast.promise(async () => { await fn(); await refresh(); }, {
        loading, success, error: (e) => friendlyMessage(e, error)
      });
      return true;
    } catch { return false; }
  }, [toast, refresh]);

  // Optimistic in-topic edits (used by the video/notes editors before persist).
  const updateTopic = useCallback((chapterId, topicId, updater) => {
    setChapters((items) => items.map((item) => item.id !== chapterId ? item : ({
      ...item,
      topics: item.topics.map((t) => t.id === topicId ? updater(t) : t)
    })));
  }, [setChapters]);

  // ---- Chapters ----
  const addChapter = useCallback((name) => {
    const title = (name || "").trim();
    if (!title) return Promise.resolve(false);
    return run(() => CourseRepository.createChapter(title),
      { loading: "Adding chapter…", success: `Chapter “${title}” added`, error: "Couldn’t add the chapter." });
  }, [run]);

  const renameChapter = useCallback((id, name) => {
    const title = (name || "").trim();
    if (!title) return Promise.resolve(false);
    return run(() => CourseRepository.updateChapter(id, { title }),
      { loading: "Renaming…", success: "Chapter renamed", error: "Couldn’t rename the chapter." });
  }, [run]);

  const deleteChapter = useCallback((id) =>
    run(() => CourseRepository.deleteChapter(id),
      { loading: "Deleting chapter…", success: "Chapter deleted", error: "Couldn’t delete the chapter." }),
  [run]);

  const moveChapter = useCallback((list, index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= list.length) return Promise.resolve(false);
    const ordered = reorder(list, index, direction).map((c) => c.id);
    return run(() => CourseRepository.reorderChapters(ordered),
      { loading: "Reordering…", success: "Order updated", error: "Couldn’t reorder chapters." });
  }, [run]);

  const setChapterFree = useCallback((id, isFree) =>
    run(() => CourseRepository.updateChapter(id, { is_free: isFree }),
      { loading: "Updating…", success: isFree ? "Chapter set to free" : "Chapter set to premium", error: "Couldn’t update access." }),
  [run]);

  const setChapterPublished = useCallback((id, isPublished) =>
    run(() => CourseRepository.updateChapter(id, { is_published: isPublished }),
      { loading: "Updating…", success: isPublished ? "Chapter published" : "Chapter unpublished", error: "Couldn’t update publish state." }),
  [run]);

  // ---- Topics ----
  const addTopic = useCallback((chapterId, name) => {
    const title = (name || "").trim();
    if (!title || !chapterId) return Promise.resolve(false);
    return run(() => CourseRepository.createTopic({ chapter_id: chapterId, title }),
      { loading: "Adding topic…", success: `Topic “${title}” added`, error: "Couldn’t add the topic." });
  }, [run]);

  const renameTopic = useCallback((id, name) => {
    const title = (name || "").trim();
    if (!title) return Promise.resolve(false);
    return run(() => CourseRepository.updateTopic(id, { title }),
      { loading: "Renaming…", success: "Topic renamed", error: "Couldn’t rename the topic." });
  }, [run]);

  const deleteTopic = useCallback((topicId) =>
    run(() => CourseRepository.deleteTopic(topicId),
      { loading: "Deleting topic…", success: "Topic deleted", error: "Couldn’t delete the topic." }),
  [run]);

  const moveTopic = useCallback((topics, index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= topics.length) return Promise.resolve(false);
    const ordered = reorder(topics, index, direction).map((t) => t.id);
    return run(() => CourseRepository.reorderTopics(ordered),
      { loading: "Reordering…", success: "Order updated", error: "Couldn’t reorder topics." });
  }, [run]);

  const setTopicFree = useCallback((id, isFree) =>
    run(() => CourseRepository.updateTopic(id, { is_free: isFree }),
      { loading: "Updating…", success: isFree ? "Topic set to free" : "Topic locked", error: "Couldn’t update access." }),
  [run]);

  // ---- Videos (youtubes) — fully persisted ----
  const addVideo = useCallback((topicId, url, title) =>
    run(() => CourseRepository.addVideo({ topic_id: topicId, url, title: (title || "").trim() || undefined }),
      { loading: "Saving video…", success: "Video added", error: "Couldn’t add the video." }),
  [run]);

  const updateVideo = useCallback((videoId, patch) =>
    run(() => CourseRepository.updateVideo(videoId, patch),
      { loading: "Saving…", success: "Video updated", error: "Couldn’t update the video." }),
  [run]);

  const deleteVideo = useCallback((videoId) =>
    run(() => CourseRepository.deleteVideo(videoId),
      { loading: "Removing video…", success: "Video removed", error: "Couldn’t remove the video." }),
  [run]);

  return {
    chapters, refresh, updateTopic,
    addChapter, renameChapter, deleteChapter, moveChapter, setChapterFree, setChapterPublished,
    addTopic, renameTopic, deleteTopic, moveTopic, setTopicFree,
    addVideo, updateVideo, deleteVideo
  };
}
