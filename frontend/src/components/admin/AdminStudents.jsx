import React, { useEffect } from "react";
import { useAdminController } from "../../hooks/useAdminController";
import { StudentManager } from "./StudentManager";

export default function AdminStudents() {
  const { students, batches, refreshStudents } = useAdminController();
  const list = students || [];
  const paidCount = list.filter((s) => s.paymentStatus === "Paid" || s.access === "full").length;
  const pendingCount = list.filter((s) => s.paymentStatus === "Unpaid" || s.paymentStatus === "Refunded").length;

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
          <div><strong>{paidCount}</strong><span>Paid</span></div>
          <div><strong>{pendingCount}</strong><span>Pending</span></div>
        </div>
      </header>

      <StudentManager batches={batches} batchFilter={null} />
    </div>
  );
}
