import React, { createContext, useContext, useState, useMemo } from "react";

const AdminContext = createContext(null);

export const AdminProvider = ({ children }) => {
  const [adminTab, setAdminTab] = useState("videos");
  const [questionBank, setQuestionBank] = useState(null);
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);

  return (
    <AdminContext.Provider
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
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdminContext must be used within an AdminProvider");
  }
  return context;
};
