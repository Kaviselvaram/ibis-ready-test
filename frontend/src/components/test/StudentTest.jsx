import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  RotateCcw,
  Target,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import { useTestController } from "../../hooks/useTestController";

const LETTERS = ["A", "B", "C", "D", "E", "F"];
const SECONDS_PER_QUESTION = 60;

function fmtTime(totalSec) {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

// ───────────────────────── Charts (no external lib) ─────────────────────────
function Donut({ percent, label }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const dash = (percent / 100) * c;
  return (
    <div className="qt-donut">
      <svg viewBox="0 0 130 130" role="img" aria-label={`${percent}% ${label}`}>
        <circle cx="65" cy="65" r={r} className="qt-donut-track" />
        <circle
          cx="65"
          cy="65"
          r={r}
          className="qt-donut-fill"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90 65 65)"
        />
      </svg>
      <div className="qt-donut-center">
        <strong>{percent}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function BarRow({ label, correct, total, accuracy }) {
  return (
    <div className="qt-bar-row">
      <span className="qt-bar-label">{label}</span>
      <div className="qt-bar-track">
        <i className="qt-bar-fill" style={{ width: `${accuracy}%` }} />
      </div>
      <span className="qt-bar-value">
        {correct}/{total} · {accuracy}%
      </span>
    </div>
  );
}

// ───────────────────────────── Config screen ────────────────────────────────
const TERMS = [
  "This is a timed test. The timer starts when you begin and the paper auto-submits when it ends.",
  "Each question carries equal marks. There is no negative marking in this practice mode.",
  "Do not refresh or close the window during the test — your attempt will be lost.",
  "Questions are auto-generated with a standardized difficulty mix; attempts may differ.",
  "Use of unfair means defeats the purpose — this report is for your own preparation.",
];

export function StudentTest({ chapter }) {
  const { loadBank, generateTest, submitTest } = useTestController();
  const [questionBank, setQuestionBank] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadBank().then(data => {
      setQuestionBank(data || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const [mode, setMode] = useState("chapter"); // chapter | topic | mock
  const [topicName, setTopicName] = useState(chapter?.topics?.[0]?.name || "");
  const [count, setCount] = useState(10);
  const [agreed, setAgreed] = useState(false);

  const [phase, setPhase] = useState("config"); // config | active | report
  const [questions, setQuestions] = useState([]);
  const [report, setReport] = useState(null);

  const scope = useMemo(() => {
    if (mode === "mock") return { chapter: null, topic: null, label: "Full Mock Test" };
    if (mode === "topic") return { chapter: chapter.name, topic: topicName, label: `${topicName}` };
    return { chapter: chapter.name, topic: null, label: chapter.name };
  }, [mode, topicName, chapter]);

  const desiredCount = mode === "mock" ? 50 : count;

  const available = useMemo(() => {
    let pool = questionBank;
    if (scope.chapter) pool = pool.filter((q) => q.chapter === scope.chapter);
    if (scope.topic) pool = pool.filter((q) => q.topic === scope.topic);
    return pool.length;
  }, [questionBank, scope]);

  const effectiveCount = Math.min(desiredCount, available);
  const durationSec = effectiveCount * SECONDS_PER_QUESTION;

  const start = async () => {
    try {
      const picked = await generateTest(questionBank, {
        chapter: scope.chapter,
        topic: scope.topic,
        count: desiredCount,
      });
      if (!picked || !picked.length) return;
      setQuestions(picked);
      setPhase("active");
    } catch (e) {
      console.error(e);
    }
  };

  const finish = async (answers, timeTakenSec) => {
    try {
      const r = await submitTest(questions, answers, {
        label: scope.label,
        mode,
        requested: desiredCount,
        delivered: questions.length,
        durationSec,
        timeTakenSec,
        date: new Date(),
      });
      setReport(r);
      setPhase("report");
    } catch (e) {
      console.error(e);
    }
  };

  const reset = () => {
    setQuestions([]);
    setReport(null);
    setAgreed(false);
    setPhase("config");
  };

  if (loading) {
    return (
      <div className="qt-config" style={{ textAlign: "center", padding: "40px 0" }}>
        <Clock size={24} className="spin" />
        <p style={{ marginTop: "12px" }}>Loading question bank...</p>
      </div>
    );
  }

  return (
    <div className="qt-config">
      <div className="qt-config-head">
        <span className="qt-config-kicker"><Target size={15} /> Practice Test</span>
        <h2>Generate a standardized test</h2>
        <p>Pick a scope and length. Questions are randomly drawn with a balanced difficulty mix, timed, and scored with a full report.</p>
      </div>

      <div className="qt-field">
        <label className="qt-field-label">Test scope</label>
        <div className="qt-mode-tabs">
          {[
            { id: "chapter", label: "This chapter" },
            { id: "topic", label: "By topic" },
            { id: "mock", label: "Full mock · 50" },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              className={`qt-mode-tab ${mode === m.id ? "active" : ""}`}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {mode === "topic" && (
        <div className="qt-field">
          <label className="qt-field-label">Topic</label>
          <select className="qt-select" value={topicName} onChange={(e) => setTopicName(e.target.value)}>
            {chapter.topics.map((t) => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      {mode !== "mock" && (
        <div className="qt-field">
          <label className="qt-field-label">Number of questions</label>
          <div className="qt-count-seg">
            {[5, 10].map((n) => (
              <button
                key={n}
                type="button"
                className={`qt-seg-btn ${count === n ? "active" : ""}`}
                onClick={() => setCount(n)}
              >
                {n} Qs
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="qt-meta-row">
        <span><Clock size={14} /> {fmtTime(durationSec)} ({SECONDS_PER_QUESTION}s/question)</span>
        <span className={available === 0 ? "qt-avail-warn" : "qt-avail"}>
          {available === 0
            ? "No questions available for this scope yet"
            : effectiveCount < desiredCount
              ? `${effectiveCount} of ${desiredCount} (only ${available} in bank)`
              : `${effectiveCount} questions ready`}
        </span>
      </div>

      <div className="qt-terms">
        <strong>Terms &amp; Conditions</strong>
        <ul className="qt-terms-list">
          {TERMS.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
        <label className="qt-agree">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span>I have read and accept the terms and conditions.</span>
        </label>
      </div>

      <button
        type="button"
        className="qt-start-btn"
        disabled={!agreed || available === 0}
        onClick={start}
      >
        Start test <ArrowRight size={18} />
      </button>

      {phase === "active" && (
        <TestRunner
          questions={questions}
          durationSec={durationSec}
          scopeLabel={scope.label}
          onCancel={reset}
          onFinish={finish}
        />
      )}
      {phase === "report" && report && (
        <TestReport report={report} onRetake={reset} onClose={reset} />
      )}
    </div>
  );
}

// ───────────────────────────── Test runner ──────────────────────────────────
export function TestRunner({ questions, durationSec, scopeLabel, onCancel, onFinish }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [remaining, setRemaining] = useState(durationSec);
  const [confirming, setConfirming] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const startRef = useRef(Date.now());
  const submittedRef = useRef(false);

  const submit = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const taken = Math.round((Date.now() - startRef.current) / 1000);
    onFinish(answers, Math.min(taken, durationSec));
  };

  useEffect(() => {
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(id);
          submit();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") setWarnings((w) => w + 1);
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  const q = questions[current];
  const chosen = answers[q.id];
  const answeredCount = Object.keys(answers).length;
  const lowTime = remaining <= 30;

  const choose = (letter) => setAnswers((a) => ({ ...a, [q.id]: letter }));

  return (
    <div className="qt-overlay" role="dialog" aria-modal="true">
      <section className="qt-runner">
        <header className="qt-runner-head">
          <div className="qt-runner-title">
            <FileText size={16} />
            <span>{scopeLabel}</span>
          </div>
          <div className={`qt-timer ${lowTime ? "low" : ""}`}>
            <Clock size={16} /> {fmtTime(remaining)}
          </div>
          <button type="button" className="qt-runner-close" aria-label="Cancel test" onClick={onCancel}>
            <X size={18} />
          </button>
        </header>

        {warnings > 0 && (
          <div className="qt-warn-banner">
            <AlertTriangle size={14} /> You left the test window {warnings} time{warnings > 1 ? "s" : ""}. Stay on this tab.
          </div>
        )}

        <div className="qt-runner-body">
          <div className="qt-qbody">
            <div className="qt-q-counter">Question {current + 1} of {questions.length}</div>
            <p className="qt-question">{q.question}</p>
            <div className="qt-options">
              {q.options.map((opt, i) => {
                const letter = LETTERS[i];
                return (
                  <button
                    key={letter}
                    type="button"
                    className={`qt-option ${chosen === letter ? "selected" : ""}`}
                    onClick={() => choose(letter)}
                  >
                    <span className="qt-option-key">{letter}</span>
                    <span className="qt-option-text">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="qt-palette">
            <span className="qt-palette-title">{answeredCount}/{questions.length} answered</span>
            <div className="qt-palette-grid">
              {questions.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  className={`qt-palette-btn ${answers[item.id] ? "answered" : ""} ${i === current ? "current" : ""}`}
                  onClick={() => setCurrent(i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button type="button" className="qt-submit-btn" onClick={() => setConfirming(true)}>
              Submit test
            </button>
          </aside>
        </div>

        <footer className="qt-runner-foot">
          <button
            type="button"
            className="qt-nav-btn"
            disabled={current === 0}
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          >
            <ArrowLeft size={16} /> Previous
          </button>
          <button
            type="button"
            className="qt-nav-btn primary"
            disabled={current === questions.length - 1}
            onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
          >
            Next <ArrowRight size={16} />
          </button>
        </footer>

        {confirming && (
          <div className="qt-confirm">
            <div className="qt-confirm-card">
              <h3>Submit the test?</h3>
              <p>You answered {answeredCount} of {questions.length} questions. Unanswered questions are marked wrong.</p>
              <div className="qt-confirm-actions">
                <button type="button" className="qt-nav-btn" onClick={() => setConfirming(false)}>Keep solving</button>
                <button type="button" className="qt-submit-btn" onClick={submit}>Submit &amp; view report</button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// ───────────────────────────── Report (2 pages) ─────────────────────────────
export function TestReport({ report, onRetake, onClose }) {
  const { getAnswerIndex } = useTestController();
  const {
    accuracy, verdict, total, correct, wrong, skipped,
    byDifficulty, byBloom, byTopic, strongest, weakest, graded, meta,
    strengths = [], focusAreas = [],
  } = report;

  const avgPerQ = meta.timeTakenSec && total ? Math.round(meta.timeTakenSec / total) : 0;
  const dateStr = new Date(meta.date).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const analysis = [];
  if (strongest) analysis.push(`Strongest area: ${strongest.key} (${strongest.accuracy}% accuracy).`);
  if (weakest && weakest.key !== strongest?.key) analysis.push(`Needs work: ${weakest.key} (${weakest.accuracy}% accuracy) — revisit the concept and worked examples.`);
  const hard = byDifficulty.find((d) => d.key === "Hard");
  if (hard && hard.total) analysis.push(`On Hard questions you scored ${hard.correct}/${hard.total}. ${hard.accuracy >= 60 ? "Good depth of understanding." : "Focus on higher-order application practice."}`);
  if (skipped) analysis.push(`${skipped} question${skipped > 1 ? "s were" : " was"} left unanswered — pace yourself to attempt every question.`);

  return (
    <div className="qt-report-overlay" role="dialog" aria-modal="true">
      <div className="qt-report-scroll">
        <div className="test-report">
          {/* ───────────── PAGE 1 — Summary & analytics ───────────── */}
          <section className="report-page">
            <header className="report-head">
              <div className="report-brand">
                <img src="/ibis-assets/logo.webp?v=20260626" alt="Ibis Physics" />
                <div>
                  <strong>Ibis Physics</strong>
                  <span>Performance Report</span>
                </div>
              </div>
              <div className="report-meta">
                <span><b>Test:</b> {meta.label}</span>
                <span><b>Date:</b> {dateStr}</span>
                <span><b>Questions:</b> {meta.delivered}{meta.delivered < meta.requested ? ` (of ${meta.requested} requested)` : ""}</span>
              </div>
            </header>

            <div className="score-hero">
              <Donut percent={accuracy} label="Accuracy" />
              <div className="score-hero-info">
                <span className={`report-verdict v-${verdict.toLowerCase().replace(/\s/g, "-")}`}>
                  <Trophy size={15} /> {verdict}
                </span>
                <strong className="score-line">{correct} / {total} correct</strong>
                <p>You completed the test in {fmtTime(meta.timeTakenSec)} (avg {avgPerQ}s/question).</p>
              </div>
              <div className="stat-tiles">
                <div className="stat-tile ok"><CheckCircle2 size={16} /><b>{correct}</b><span>Correct</span></div>
                <div className="stat-tile bad"><XCircle size={16} /><b>{wrong}</b><span>Wrong</span></div>
                <div className="stat-tile neutral"><FileText size={16} /><b>{skipped}</b><span>Skipped</span></div>
                <div className="stat-tile time"><Clock size={16} /><b>{fmtTime(meta.timeTakenSec)}</b><span>Time</span></div>
              </div>
            </div>

            <div className="report-cols">
              <div className="report-section">
                <h3>Accuracy by difficulty</h3>
                {byDifficulty.filter((d) => d.total).map((d) => (
                  <BarRow key={d.key} label={d.key} correct={d.correct} total={d.total} accuracy={d.accuracy} />
                ))}
              </div>
              <div className="report-section">
                <h3>Accuracy by Bloom level</h3>
                {byBloom.map((b) => (
                  <BarRow key={b.key} label={b.key} correct={b.correct} total={b.total} accuracy={b.accuracy} />
                ))}
              </div>
            </div>

            <div className="report-section">
              <h3>Accuracy by topic</h3>
              {byTopic.map((t) => (
                <BarRow key={t.key} label={t.key} correct={t.correct} total={t.total} accuracy={t.accuracy} />
              ))}
            </div>

            <div className="report-swot">
              <div className="report-swot-col strong">
                <h4><Target size={15} /> Strengths</h4>
                {strengths.length ? (
                  <ul>{strengths.map((s) => <li key={s.key}><b>{s.key}</b><span>{s.correct}/{s.total} · {s.accuracy}%</span></li>)}</ul>
                ) : <p className="report-swot-empty">Keep practising to build clear strengths.</p>}
              </div>
              <div className="report-swot-col focus">
                <h4><AlertTriangle size={15} /> Focus areas</h4>
                {focusAreas.length ? (
                  <ul>{focusAreas.map((f) => <li key={f.key}><b>{f.key}</b><span>{f.correct}/{f.total} · {f.accuracy}%</span></li>)}</ul>
                ) : <p className="report-swot-empty">No weak areas this time — great work!</p>}
              </div>
            </div>

            <div className="report-analysis">
              <h3>Examiner's analysis</h3>
              <ul>
                {analysis.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>

            <footer className="report-foot">Ibis Physics · Auto-generated practice report · Page 1 of 2</footer>
          </section>

          {/* ───────────── PAGE 2 — Answer key & explanations ───────────── */}
          <section className="report-page">
            <header className="report-head compact">
              <div className="report-brand">
                <img src="/ibis-assets/logo.webp?v=20260626" alt="Ibis Physics" />
                <div><strong>Answer Key &amp; Explanations</strong><span>{meta.label}</span></div>
              </div>
            </header>

            <div className="review-list">
              {graded.map((g, idx) => (
                <article key={g.q.id} className={`review-item ${g.correct ? "is-correct" : g.given ? "is-wrong" : "is-skipped"}`}>
                  <div className="review-q-head">
                    <span className="review-num">Q{idx + 1}</span>
                    <span className={`review-status ${g.correct ? "ok" : g.given ? "bad" : "skip"}`}>
                      {g.correct ? "Correct" : g.given ? "Wrong" : "Skipped"}
                    </span>
                    <span className="review-tags">
                      <i className="tag">{g.q.topic}</i>
                      <i className="tag">{g.q.difficulty}</i>
                      <i className="tag">{g.q.bloomLevel}</i>
                    </span>
                  </div>
                  <p className="review-q">{g.q.question}</p>
                  <div className="review-options">
                    {g.q.options.map((opt, i) => {
                      const letter = LETTERS[i];
                      const isCorrect = getAnswerIndex(g.q) === i;
                      const isChosenWrong = g.given === letter && !g.correct;
                      return (
                        <div key={letter} className={`review-opt ${isCorrect ? "correct" : ""} ${isChosenWrong ? "wrong" : ""}`}>
                          <span className="review-opt-key">{letter}</span>
                          <span>{opt}</span>
                          {isCorrect && <CheckCircle2 size={14} />}
                          {isChosenWrong && <XCircle size={14} />}
                        </div>
                      );
                    })}
                  </div>
                  <p className="review-explain"><b>Explanation:</b> {g.q.explanation}</p>
                  <span className="review-source">Source: {g.q.source}</span>
                </article>
              ))}
            </div>

            <footer className="report-foot">Ibis Physics · Auto-generated practice report · Page 2 of 2</footer>
          </section>
        </div>

        <div className="report-actions">
          <button type="button" className="qt-nav-btn" onClick={onClose}><X size={16} /> Close</button>
          {onRetake && <button type="button" className="qt-nav-btn" onClick={onRetake}><RotateCcw size={16} /> Retake</button>}
          <button type="button" className="qt-start-btn compact" onClick={() => window.print()}>
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}
