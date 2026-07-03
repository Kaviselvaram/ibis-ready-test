import React, { useEffect, useState } from "react";
import { ArrowLeft, ClipboardList, Clock, Layers, Play, Radio, History } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TestRepository, testTypeLabel } from "../../repositories/TestRepository";
import { useTestController } from "../../hooks/useTestController";
import { useToast, friendlyMessage } from "../../contexts/ToastContext";
import { TestRunner, TestReport } from "./StudentTest";
import PracticeBuilder from "./PracticeBuilder";
import { Button, GlassButton } from "../ui/LegacyUI";

const TYPE_ORDER = ["full_syllabus", "combined", "full_chapter", "half_chapter"];

export default function TestCenter() {
  const navigate = useNavigate();
  const toast = useToast();
  const { submitTest } = useTestController();

  const [tests, setTests] = useState(null);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState("browse"); // browse | active | report
  const [active, setActive] = useState(null); // { test, questions }
  const [report, setReport] = useState(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    TestRepository.availableTests()
      .then((t) => setTests(t || []))
      .catch(() => { setTests([]); setError("Could not load tests. Please try again."); });
  }, []);

  const startTest = async (t) => {
    setStarting(true);
    setError("");
    try {
      const data = await TestRepository.startTest(t.id);
      if (!data?.questions?.length) {
        setError("This test has no questions available yet.");
        return;
      }
      setActive(data);
      setPhase("active");
    } catch (e) {
      setError(e?.cause?.message || "Could not start this test.");
    } finally {
      setStarting(false);
    }
  };

  // Student-built practice test: the builder hands us a ready { test, questions }.
  const startPractice = (built) => {
    setError("");
    setActive(built);
    setPhase("active");
  };

  // Returns true only when the attempt was submitted AND stored (so the runner
  // locks). On failure it surfaces a clear message and returns false so the
  // student can retry — answers are preserved by the runner.
  const finish = async (answers, timeTakenSec) => {
    try {
      const durationSec = active.test.duration_minutes * 60;
      const r = await submitTest(active.questions, answers, {
        label: active.test.title,
        mode: active.test.test_type,
        testId: active.test.id,
        requested: active.test.question_count,
        delivered: active.questions.length,
        durationSec,
        timeTakenSec,
        date: new Date()
      });
      if (r?.attemptId) {
        toast.success("Test submitted");
        navigate(`/test-result/${r.attemptId}`);
        return true;
      }
      // Graded but not stored — show the report but warn it's not in history.
      toast.error("Submitted, but your result couldn't be saved to history.");
      setReport(r);
      setPhase("report");
      return true;
    } catch (e) {
      toast.error(friendlyMessage(e, "Couldn’t submit — check your connection and try again."));
      return false;
    }
  };

  const reset = () => { setActive(null); setReport(null); setPhase("browse"); };

  const grouped = TYPE_ORDER
    .map((type) => ({ type, items: (tests || []).filter((t) => t.test_type === type) }))
    .filter((g) => g.items.length);

  return (
    <section className="testcenter">
      <header className="tc-head">
        <GlassButton type="button" size="icon" onClick={() => navigate("/student")} aria-label="Back to portal">
          <ArrowLeft size={18} />
        </GlassButton>
        <div>
          <h1>Take a Test</h1>
          <p>
            {tests && tests.length > 0
              ? `${tests.length} live test${tests.length === 1 ? "" : "s"} available. Each is timed and gives you a full performance report.`
              : "Choose a live test below. Each is timed and gives you a full performance report."}
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate("/test-history")} className="tc-history-btn">
          <History size={16} /> My History
        </Button>
      </header>

      {error && <div className="tc-error">{error}</div>}

      {phase === "browse" && (
        <PracticeBuilder onStart={startPractice} defaultMode="mock" />
      )}

      {!tests && <p className="tc-empty">Loading available tests…</p>}

      {tests && tests.length === 0 && (
        <div className="tc-livetests-empty">
          <Radio size={16} /> No live tests from your mentor right now — build your own above.
        </div>
      )}

      {tests && tests.length > 0 && <h3 className="tc-section-title">Live tests from your mentor</h3>}

      {grouped.map((g) => (
        <div key={g.type} className="tc-group">
          <h3 className="tc-group-title">{testTypeLabel(g.type)} Tests</h3>
          <div className="tc-grid">
            {g.items.map((t) => (
              <article key={t.id} className="tc-card">
                <span className="tc-live"><Radio size={12} /> Live</span>
                <h4>{t.title}</h4>
                <div className="tc-meta">
                  <span><Layers size={13} /> {t.chapter_ids?.length || 0} chapter{(t.chapter_ids?.length || 0) === 1 ? "" : "s"}</span>
                  <span><ClipboardList size={13} /> {t.question_count} questions</span>
                  <span><Clock size={13} /> {t.duration_minutes} min</span>
                </div>
                <Button variant="primary" onClick={() => startTest(t)} disabled={starting}>
                  <Play size={15} /> Start test
                </Button>
              </article>
            ))}
          </div>
        </div>
      ))}

      {phase === "active" && active && (
        <TestRunner
          questions={active.questions}
          durationSec={active.test.duration_minutes * 60}
          scopeLabel={active.test.title}
          onCancel={reset}
          onFinish={finish}
        />
      )}
      {phase === "report" && report && (
        <TestReport report={report} onRetake={reset} onClose={reset} />
      )}
    </section>
  );
}
