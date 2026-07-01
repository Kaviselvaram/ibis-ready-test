import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from "react";
import { CourseRepository } from "../repositories/CourseRepository";
import { supabase } from "../lib/supabaseClient";


const CourseContext = createContext(null);

export const CourseProvider = ({ children }) => {
  const [chapters, setChapters] = useState([]);
  const [studyData, setStudyData] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [topicIndex, setTopicIndex] = useState(0);
  const [tab, setTab] = useState("content");

  const activeChapter = chapters[chapterIndex] || (chapters.length > 0 ? chapters[0] : null);

  // Live course updates: keep every open portal in sync with admin edits.
  const refreshChapters = useCallback(async () => {
    try {
      const chaps = await CourseRepository.getChapters();
      setChapters(chaps || []);
    } catch (e) {
      console.error("Live course refresh failed:", e);
    }
  }, []);

  useEffect(() => {
    // (a) Refetch whenever the tab regains focus — works everywhere, no config.
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshChapters();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    // (b) Instant updates via Supabase Realtime on structural course tables.
    //     Activates once the realtime migration (publication + anon RLS) is
    //     applied; harmless before that (simply receives no events).
    let channel;
    if (supabase) {
      channel = supabase
        .channel("course-live")
        .on("postgres_changes", { event: "*", schema: "public", table: "chapters" }, refreshChapters)
        .on("postgres_changes", { event: "*", schema: "public", table: "topics" }, refreshChapters)
        .subscribe();
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      if (channel && supabase) supabase.removeChannel(channel);
    };
  }, [refreshChapters]);

  return (
    <CourseContext.Provider
      value={useMemo(() => ({
        chapters,
        setChapters,
        studyData,
        setStudyData,
        leaderboard,
        setLeaderboard,
        chapterIndex,
        setChapterIndex,
        topicIndex,
        setTopicIndex,
        tab,
        setTab,
        activeChapter,
      }), [chapters, chapterIndex, topicIndex, tab, activeChapter, studyData, leaderboard])}
    >
      {children}
    </CourseContext.Provider>
  );
};

export const useCourseContext = () => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error("useCourseContext must be used within a CourseProvider");
  }
  return context;
};
