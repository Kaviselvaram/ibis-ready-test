import React, { useEffect } from "react";
import { useAdminController } from "../../hooks/useAdminController";
import { StudentManager } from "./StudentManager";

export default function AdminStudents() {
  const { students, batches, refreshStudents } = useAdminController();
  const list = students || [];
  const fullCount = list.filter((s) => s.access === "full").length;

  // Keep the roster in sync with the DB: refetch when the tab regains focus.
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === "visible") refreshStudents(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [refreshStudents]);

  return (
    <div className="adminx-page">
      <header className="adminx-pagehead">
        <div>
          <h1>Students</h1>
          <p>Everyone who has signed up. Search, edit access, and manage enrolments.</p>
        </div>
        <div className="adminx-headstats">
          <div><strong>{list.length}</strong><span>Total</span></div>
          <div><strong>{fullCount}</strong><span>Full access</span></div>
          <div><strong>{list.length - fullCount}</strong><span>Trial</span></div>
        </div>
      </header>

      <div className="adminx-panel">
        <StudentManager batches={batches} batchFilter={null} />
      </div>
    </div>
  );
}
