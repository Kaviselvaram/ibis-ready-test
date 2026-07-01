import React from "react";
import { Users } from "lucide-react";
import { useAdminController } from "../../hooks/useAdminController";
import { StudentManager } from "./StudentManager";

export default function AdminStudents() {
  const { students, batches } = useAdminController();
  const list = students || [];
  const fullCount = list.filter((s) => s.access === "full").length;

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
