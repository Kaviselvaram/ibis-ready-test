import re

# 1. AuthContext.jsx
filepath = "frontend/src/contexts/AuthContext.jsx"
with open(filepath, "r") as f:
    code = f.read()

code = code.replace('import React, { createContext, useContext, useState } from "react";', 'import React, { createContext, useContext, useState, useMemo } from "react";')
code = code.replace("""  const value = {
    user,
    setUser,
    loading,
    setLoading,
    isSignedIn: Boolean(user),
    isConfigured: true
  };""", """  const value = useMemo(() => ({
    user,
    setUser,
    loading,
    setLoading,
    isSignedIn: Boolean(user),
    isConfigured: true
  }), [user, loading]);""")

with open(filepath, "w") as f:
    f.write(code)

# 2. CourseContext.jsx
filepath = "frontend/src/contexts/CourseContext.jsx"
with open(filepath, "r") as f:
    code = f.read()

code = code.replace('import React, { createContext, useContext, useState } from "react";', 'import React, { createContext, useContext, useState, useMemo } from "react";')
code = code.replace("""    <CourseContext.Provider
      value={{
        chapters,
        setChapters,
        chapterIndex,
        setChapterIndex,
        topicIndex,
        setTopicIndex,
        tab,
        setTab,
        activeChapter,
      }}
    >""", """    <CourseContext.Provider
      value={useMemo(() => ({
        chapters,
        setChapters,
        chapterIndex,
        setChapterIndex,
        topicIndex,
        setTopicIndex,
        tab,
        setTab,
        activeChapter,
      }), [chapters, chapterIndex, topicIndex, tab, activeChapter])}
    >""")

with open(filepath, "w") as f:
    f.write(code)

# 3. AdminContext.jsx
filepath = "frontend/src/contexts/AdminContext.jsx"
with open(filepath, "r") as f:
    code = f.read()

code = code.replace('import React, { createContext, useContext, useState } from "react";', 'import React, { createContext, useContext, useState, useMemo } from "react";')
code = code.replace("""    <AdminContext.Provider
      value={{
        adminTab,
        setAdminTab,
        questionBank,
        setQuestionBank,
        students,
        setStudents,
        batches,
        setBatches,
      }}
    >""", """    <AdminContext.Provider
      value={useMemo(() => ({
        adminTab,
        setAdminTab,
        questionBank,
        setQuestionBank,
        students,
        setStudents,
        batches,
        setBatches,
      }), [adminTab, questionBank, students, batches])}
    >""")

with open(filepath, "w") as f:
    f.write(code)


# 4. UIContext.jsx
filepath = "frontend/src/contexts/UIContext.jsx"
with open(filepath, "r") as f:
    code = f.read()

code = code.replace('import React, { createContext, useContext, useState } from "react";', 'import React, { createContext, useContext, useState, useMemo } from "react";')
code = code.replace("""    <UIContext.Provider
      value={{
        pricingSource,
        setPricingSource,
        batchOpen,
        setBatchOpen,
        paywall,
        setPaywall,
      }}
    >""", """    <UIContext.Provider
      value={useMemo(() => ({
        pricingSource,
        setPricingSource,
        batchOpen,
        setBatchOpen,
        paywall,
        setPaywall,
      }), [pricingSource, batchOpen, paywall])}
    >""")

with open(filepath, "w") as f:
    f.write(code)

# 5. AccessContext.jsx
filepath = "frontend/src/contexts/AccessContext.jsx"
with open(filepath, "r") as f:
    code = f.read()

code = code.replace('import React, { createContext, useContext, useState } from "react";', 'import React, { createContext, useContext, useState, useMemo } from "react";')
code = code.replace("""    <AccessContext.Provider value={{ access, setAccess }}>""", """    <AccessContext.Provider value={useMemo(() => ({ access, setAccess }), [access])}>""")

with open(filepath, "w") as f:
    f.write(code)

