import React, { useEffect, useMemo, useState } from "react";
import { Target, BookOpen, Layers, Play, CircleDot, Circle } from "lucide-react";
import { TestRepository } from "../../repositories/TestRepository";
import { useToast, friendlyMessage } from "../../contexts/ToastContext";
import { Button } from "../ui/LegacyUI";

const COUNTS = [10, 20, 30, 50];
const durationFor = (count) => Math.max(5, Math.round(count * 1.2));

const MODES = [
  { key: "mock", label: "Full Mock", icon: Target },
  { key: "chapters", label: "By Chapter", icon: BookOpen },
  { key: "topics", label: "By Topic", icon: Layers }
];

// Student-built practice tests — scope drawn from the admin question bank.
export default function PracticeBuilder({ onStart, defaultMode = "mock" }) {
  const toast = useToast();
  const [scope, setScope] = useState(null);
  const [mode, setMode] = useState(defaultMode);
  const [selChapters, setSelChapters] = useState([]);
  const [topicChapter, setTopicChapter] = useState("");
  const [selTopics, setSelTopics] = useState([]);
  const [count, setCount] = useState(20);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    TestRepository.getScope()
      .then((s) => { setScope(s); if (s?.chapters?.[0]) setTopicChapter(s.chapters[0].name); })
      .catch(() => setScope({ total: 0, chapters: [] }));
  }, []);

  const chapters = scope?.chapters || [];
  const topics = chapters.find((c) => c.name === topicChapter)?.topics || [];

  // Reset topic selection when the chapter context changes.
  useEffect(() => { setSelTopics([]); }, [topicChapter]);

  const available = useMemo(() => {
    if (!scope) return 0;
    if (mode === "mock") return scope.total;
    if (mode === "chapters") return chapters.filter((c) => selChapters.includes(c.name)).reduce((n, c) => n + c.count, 0);
    return topics.filter((t) => selTopics.includes(t.name)).reduce((n, t) => n + t.count, 0);
  }, [scope, mode, selChapters, selTopics, topics, chapters]);

  const canStart = !busy && available > 0 &&
    (mode === "mock" || (mode === "chapters" && selChapters.length) || (mode === "topics" && selTopics.length));

  const toggle = (list, setList, name) =>
    setList(list.includes(name) ? list.filter((x) => x !== name) : [...list, name]);

  const start = async () => {
    if (!canStart) return;
    setBusy(true);
    try {
      const scopePayload = mode === "mock" ? {} : mode === "chapters" ? { chapters: selChapters } : { topics: selTopics };
      const effCount = Math.min(count, available);
      const questions = await TestRepository.generatePractice({ ...scopePayload, count: effCount });
      if (!questions?.length) { toast.error("No questions found for this selection."); setBusy(false); return; }
      const title =
        mode === "mock" ? "Full Mock Test"
        : mode === "chapters" ? (selChapters.length === 1 ? `${selChapters[0]}` : `${selChapters.length} chapters`)
        : (selTopics.length === 1 ? `${selTopics[0]}` : `${selTopics.length} topics`);
      onStart({
        test: {
          id: null,
          title: mode === "mock" ? title : `${title} — Practice`,
          test_type: mode === "mock" ? "full_syllabus" : mode === "chapters" ? "combined" : "half_chapter",
          duration_minutes: durationFor(questions.length),
          question_count: questions.length
        },
        questions
      });
    } catch (e) {
      toast.error(friendlyMessage(e, "Couldn’t start the practice test."));
      setBusy(false);
    }
  };

  if (!scope) return <section className="pb-card"><p className="tc-empty">Loading practice options…</p></section>;
  if (scope.total === 0) return null; // no question bank yet → nothing to build

  return (
    <section className="pb-card">
      <div className="pb-head">
        <h3><Target size={17} /> Build your own test</h3>
        <p>Practice on your terms — questions are drawn from the {scope.total}-question bank.</p>
      </div>

      <div className="pb-modes">
        {MODES.map(({ key, label, icon: Icon }) => (
          <button key={key} className={`pb-mode ${mode === key ? "active" : ""}`} onClick={() => setMode(key)}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {mode === "mock" && (
        <p className="pb-hint">A timed mock drawing from all <strong>{scope.total}</strong> questions across the syllabus.</p>
      )}

      {mode === "chapters" && (
        <div className="pb-pickgroup">
          <span className="pb-pick-label">Select chapters</span>
          <div className="pb-chips">
            {chapters.map((c) => (
              <button key={c.name} className={`pb-chip ${selChapters.includes(c.name) ? "on" : ""}`} onClick={() => toggle(selChapters, setSelChapters, c.name)}>
                {selChapters.includes(c.name) ? <CircleDot size={13} /> : <Circle size={13} />}
                {c.name} <em>{c.count}</em>
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === "topics" && (
        <div className="pb-pickgroup">
          <span className="pb-pick-label">Chapter</span>
          <select className="pb-select" value={topicChapter} onChange={(e) => setTopicChapter(e.target.value)}>
            {chapters.map((c) => <option key={c.name} value={c.name}>{c.name} ({c.count})</option>)}
          </select>
          <span className="pb-pick-label">Select topics</span>
          <div className="pb-chips">
            {topics.length === 0 && <p className="tc-empty">No topics with questions in this chapter.</p>}
            {topics.map((t) => (
              <button key={t.name} className={`pb-chip ${selTopics.includes(t.name) ? "on" : ""}`} onClick={() => toggle(selTopics, setSelTopics, t.name)}>
                {selTopics.includes(t.name) ? <CircleDot size={13} /> : <Circle size={13} />}
                {t.name} <em>{t.count}</em>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="pb-foot">
        <div className="pb-counts">
          <span className="pb-pick-label">Questions</span>
          <div className="pb-count-seg">
            {COUNTS.map((n) => (
              <button key={n} className={`pb-count ${count === n ? "active" : ""}`} disabled={n > available && available > 0} onClick={() => setCount(n)}>{n}</button>
            ))}
          </div>
          <small className="pb-available">{available} available{available > 0 && count > available ? ` · using ${available}` : ""}</small>
        </div>
        <Button variant="primary" onClick={start} disabled={!canStart}>
          <Play size={15} /> {busy ? "Preparing…" : "Start practice test"}
        </Button>
      </div>
    </section>
  );
}
