import React, { createContext, useContext, useState, useMemo } from "react";


const CourseContext = createContext(null);

export const CourseProvider = ({ children }) => {
  const [chapters, setChapters] = useState([]);
  const [studyData, setStudyData] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [topicIndex, setTopicIndex] = useState(0);
  const [tab, setTab] = useState("content");

  const activeChapter = chapters[chapterIndex] || (chapters.length > 0 ? chapters[0] : null);

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
