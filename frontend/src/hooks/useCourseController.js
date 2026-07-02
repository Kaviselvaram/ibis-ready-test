import { CourseRepository } from "../repositories/CourseRepository";
import { useEffect } from "react";
import { useNavigationController } from "./useNavigationController";
import { useCourseContext } from "../contexts/CourseContext";
import { useAccessContext } from "../contexts/AccessContext";
import { useUI } from "../contexts/UIContext";

export const useCourseController = () => {
  const { chapters, setChapters, chapterIndex, setChapterIndex, setTopicIndex, setTab, activeChapter, studyData, setStudyData, leaderboard, setLeaderboard } = useCourseContext();
  const { access } = useAccessContext();
  const { setPaywall } = useUI();
  const { goToChapter, goToCheckout } = useNavigationController();
  
  useEffect(() => {
    const initCourse = async () => {
      if (chapters.length === 0) {
        try {
          const chaps = await CourseRepository.getChapters();
          setChapters(chaps);
        } catch (error) {
          console.error("Failed to fetch chapters:", error);
        }
        
        try {
          const study = await CourseRepository.getStudyData();
          setStudyData(study);
        } catch (error) {
          console.warn("Could not fetch study data (expected if logged out)");
        }
        
        try {
          const board = await CourseRepository.getLeaderboard();
          setLeaderboard(board);
        } catch (error) {
          console.warn("Could not fetch leaderboard (expected if logged out)");
        }
      }
    };
    initCourse();
  }, [chapters.length, setChapters, setStudyData, setLeaderboard]);

  // Fetch the (batch-scoped) leaderboard whenever it's empty — decoupled from the
  // chapters gate so it still loads on SPA transitions or after joining a batch.
  useEffect(() => {
    if (leaderboard.length > 0) return;
    let active = true;
    CourseRepository.getLeaderboard()
      .then((board) => { if (active && Array.isArray(board) && board.length) setLeaderboard(board); })
      .catch(() => { /* expected when logged out */ });
    return () => { active = false; };
  }, [leaderboard.length, setLeaderboard]);

  const switchChapter = (direction) => {
    setChapterIndex((current) => (current + direction + chapters.length) % chapters.length);
    setTopicIndex(0);
  };

  const openChapter = () => {
    // Chapter-level access: trial students get exactly the free chapter;
    // any other chapter is premium → send them to the pricing page.
    const chapterFree = activeChapter?.isFree === true;
    if (access !== "full" && !chapterFree) {
      goToCheckout();
      return;
    }
    setTopicIndex(0);
    setTab("content");
    goToChapter();
  };

  return { switchChapter, openChapter };
};
