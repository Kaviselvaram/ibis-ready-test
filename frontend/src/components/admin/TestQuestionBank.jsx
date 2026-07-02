import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, Database } from "lucide-react";
import { useAdminController } from "../../hooks/useAdminController";
import { AdminQuestionBank } from "../test/AdminQuestionBank";

export default function TestQuestionBank() {
  const { questionBank, updateQuestionBank } = useAdminController();

  return (
    <div className="adminx-page">
      <nav className="content-breadcrumb">
        <Link to="/admin/tests"><ArrowLeft size={14} /> Tests</Link>
        <ChevronRight size={13} />
        <span>Question bank</span>
      </nav>

      <header className="adminx-pagehead">
        <div>
          <h1><Database size={22} style={{ verticalAlign: "-3px", color: "var(--clay-dark)" }} /> Question bank</h1>
          <p>The master pool of questions. Every test draws from here, filtered by the chapters you pick when creating it.</p>
        </div>
      </header>

      <section className="tmx-bank">
        <AdminQuestionBank questionBank={questionBank} setQuestionBank={updateQuestionBank} />
      </section>
    </div>
  );
}
