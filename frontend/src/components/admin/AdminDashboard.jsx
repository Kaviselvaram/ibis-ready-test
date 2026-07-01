import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { BookOpen, Layers, Users, ClipboardList, Radio, ArrowRight, HelpCircle } from "lucide-react";
import { useCourseContext } from "../../contexts/CourseContext";
import { useAdminController } from "../../hooks/useAdminController";
import { TestRepository } from "../../repositories/TestRepository";
import { CourseRepository } from "../../repositories/CourseRepository";
import { useAuthenticationController } from "../../hooks/useAuthenticationController";

function Stat({ icon: Icon, label, value, to }) {
  const body = (
    <>
      <span className="dash-stat-icon"><Icon size={18} /></span>
      <div className="dash-stat-body">
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
      {to && <ArrowRight size={16} className="dash-stat-arrow" />}
    </>
  );
  return to ? <NavLink to={to} className="dash-stat">{body}</NavLink> : <div className="dash-stat">{body}</div>;
}

export default function AdminDashboard() {
  const { chapters, setChapters } = useCourseContext();
  const { students, questionBank } = useAdminController();
  const { user } = useAuthenticationController();
  const [tests, setTests] = useState([]);

  useEffect(() => {
    TestRepository.listTests().then((t) => setTests(t || [])).catch(() => setTests([]));
  }, []);

  useEffect(() => {
    if (chapters.length === 0) {
      CourseRepository.getChapters().then((c) => setChapters(c || [])).catch(() => {});
    }
  }, [chapters.length, setChapters]);

  const topicCount = chapters.reduce((n, c) => n + (c.topics?.length || 0), 0);
  const liveTests = tests.filter((t) => t.is_live).length;
  const qCount = Array.isArray(questionBank) ? questionBank.length : 0;

  return (
    <div className="adminx-page">
      <header className="adminx-pagehead">
        <div>
          <h1>Welcome back, {user?.name || "Admin"}</h1>
          <p>Here's an overview of your platform. Everything is live and synced with the database.</p>
        </div>
      </header>

      <div className="dash-stats">
        <Stat icon={BookOpen} label="Chapters" value={chapters.length} to="/admin/content" />
        <Stat icon={Layers} label="Topics" value={topicCount} to="/admin/content" />
        <Stat icon={Users} label="Students" value={students.length} to="/admin/students" />
        <Stat icon={ClipboardList} label="Tests" value={tests.length} to="/admin/tests" />
        <Stat icon={Radio} label="Live tests" value={liveTests} to="/admin/tests" />
        <Stat icon={HelpCircle} label="Questions" value={qCount} to="/admin/tests" />
      </div>

      <div className="dash-links">
        <NavLink to="/admin/content" className="dash-link">
          <BookOpen size={20} />
          <div><strong>Manage content</strong><span>Chapters, topics, videos & notes</span></div>
          <ArrowRight size={16} />
        </NavLink>
        <NavLink to="/admin/tests" className="dash-link">
          <ClipboardList size={20} />
          <div><strong>Build tests</strong><span>Create & publish tests, edit the question bank</span></div>
          <ArrowRight size={16} />
        </NavLink>
        <NavLink to="/admin/students" className="dash-link">
          <Users size={20} />
          <div><strong>Students</strong><span>View enrolments & manage access</span></div>
          <ArrowRight size={16} />
        </NavLink>
      </div>
    </div>
  );
}
