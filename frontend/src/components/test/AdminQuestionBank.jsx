import React, { useMemo, useRef, useState } from "react";
import {
  AlertTriangle, CheckCircle2, Edit3, FileUp, Plus, Save, Trash2, Database, X,
  Search, ChevronDown, ChevronRight, Upload, ListFilter
} from "lucide-react";
import { normalizeUpload, bankSummary, DIFFICULTIES, BLOOM_LEVELS } from "../../repositories/QuestionBankRepository";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

const SAMPLE = `[
  {
    "chapter": "Current Electricity",
    "topic": "Kirchhoff Rules",
    "questionType": "Application-Based Numerical MCQ",
    "bloomLevel": "Apply",
    "difficulty": "Medium",
    "question": "A 12 V battery drives current through 4 Ω and 2 Ω in series. Find the current.",
    "options": ["1 A", "2 A", "3 A", "6 A"],
    "answer": "B",
    "explanation": "Total R = 6 Ω, I = V/R = 12/6 = 2 A.",
    "source": "Question Bank 1"
  }
]`;

export function AdminQuestionBank({ questionBank, setQuestionBank }) {
  const [raw, setRaw] = useState("");
  const [result, setResult] = useState(null); // { added, errors }
  const [editingId, setEditingId] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [chapterFilter, setChapterFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [collapsed, setCollapsed] = useState({}); // chapter name -> true if collapsed
  const fileRef = useRef(null);

  const summary = useMemo(() => questionBank ? bankSummary(questionBank) : { total: 0, chapters: [] }, [questionBank]);

  // Filter, then group by chapter so the list is scannable instead of one long scroll.
  const groups = useMemo(() => {
    if (!questionBank) return [];
    const q = query.trim().toLowerCase();
    const filtered = questionBank.filter((item) => {
      if (chapterFilter !== "all" && item.chapter !== chapterFilter) return false;
      if (difficultyFilter !== "all" && item.difficulty !== difficultyFilter) return false;
      if (!q) return true;
      return (
        (item.question || "").toLowerCase().includes(q) ||
        (item.topic || "").toLowerCase().includes(q) ||
        (item.chapter || "").toLowerCase().includes(q)
      );
    });
    const byChapter = new Map();
    filtered.forEach((item) => {
      if (!byChapter.has(item.chapter)) byChapter.set(item.chapter, []);
      byChapter.get(item.chapter).push(item);
    });
    return [...byChapter.entries()]
      .map(([name, items]) => ({ name, items }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [questionBank, query, chapterFilter, difficultyFilter]);

  const filteredCount = groups.reduce((n, g) => n + g.items.length, 0);
  const searching = query.trim() || chapterFilter !== "all" || difficultyFilter !== "all";

  if (!questionBank) {
    return <div className="qbank2"><p className="qbank-empty">Loading question bank…</p></div>;
  }

  const ingest = (text) => {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      setResult({ added: 0, errors: [`Invalid JSON: ${e.message}`] });
      return;
    }
    const { valid, errors } = normalizeUpload(parsed);
    if (valid.length) {
      const newBank = [...questionBank, ...valid];
      setQuestionBank(newBank);
    }
    setResult({ added: valid.length, errors });
  };

  const onUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setRaw(text);
      ingest(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const removeQuestion = (id) => {
    const newBank = questionBank.filter((q) => q.id !== id);
    setQuestionBank(newBank);
  };
  const updateQuestion = (id, patch) => {
    const newBank = questionBank.map((q) => (q.id === id ? { ...q, ...patch } : q));
    setQuestionBank(newBank);
    setEditingId(null);
  };
  const clearAll = () => {
    if (window.confirm("Remove all questions from the bank? This cannot be undone.")) {
      setQuestionBank([]);
      setResult(null);
    }
  };
  const toggleChapter = (name) => setCollapsed((c) => ({ ...c, [name]: !c[name] }));

  return (
    <div className="qbank2">
      {/* Sticky toolbar: stats + search + filters + import toggle. */}
      <div className="qbank2-toolbar">
        <div className="qbank2-stats">
          <span className="qbank2-kicker"><Database size={14} /> {summary.total} questions</span>
          <span className="qbank2-kicker sub">{summary.chapters.length} chapters</span>
        </div>
        <div className="qbank2-search">
          <Search size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search question, topic or chapter…"
          />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={13} /></button>}
        </div>
        <div className="qbank2-filters">
          <label className="qbank2-select">
            <ListFilter size={13} />
            <select value={chapterFilter} onChange={(e) => setChapterFilter(e.target.value)}>
              <option value="all">All chapters</option>
              {summary.chapters.map((c) => <option key={c.name} value={c.name}>{c.name} ({c.count})</option>)}
            </select>
          </label>
          <label className="qbank2-select">
            <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)}>
              <option value="all">Any difficulty</option>
              {Object.values(DIFFICULTIES).map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
        </div>
        <div className="qbank2-actions">
          <button type="button" className={`qbank-btn ${importOpen ? "primary" : ""}`} onClick={() => setImportOpen((o) => !o)}>
            <Upload size={15} /> Import
          </button>
          <button type="button" className="qbank-clear" onClick={clearAll} disabled={!summary.total} title="Remove all questions">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Collapsible importer — hidden by default so it never pushes the list down. */}
      {importOpen && (
        <div className="qbank2-import">
          <textarea
            className="qbank-textarea"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={SAMPLE}
            spellCheck={false}
          />
          <div className="qbank-upload-actions">
            <button type="button" className="qbank-btn" onClick={() => fileRef.current?.click()}>
              <FileUp size={16} /> Upload .json
            </button>
            <button type="button" className="qbank-btn ghost" onClick={() => setRaw(SAMPLE)}>Load sample</button>
            <button type="button" className="qbank-btn primary" onClick={() => ingest(raw)} disabled={!raw.trim()}>
              <Plus size={16} /> Add to bank
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onUpload} />
          </div>
          {result && (
            <div className="qbank-result">
              {result.added > 0 && (
                <p className="qbank-ok"><CheckCircle2 size={15} /> Added {result.added} question{result.added > 1 ? "s" : ""} to the bank.</p>
              )}
              {result.errors.length > 0 && (
                <div className="qbank-errors">
                  <p><AlertTriangle size={15} /> {result.errors.length} entr{result.errors.length > 1 ? "ies" : "y"} skipped:</p>
                  <ul>{result.errors.slice(0, 8).map((er, i) => <li key={i}>{er}</li>)}</ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Grouped, internally-scrolling list — the page itself doesn't grow. */}
      <div className="qbank2-list">
        {summary.total === 0 && (
          <div className="qbank2-empty">
            <Database size={26} />
            <p>No questions yet. Use <b>Import</b> to paste or upload JSON.</p>
          </div>
        )}
        {summary.total > 0 && filteredCount === 0 && (
          <div className="qbank2-empty"><Search size={22} /><p>No questions match your search or filters.</p></div>
        )}
        {groups.map((group) => {
          const isCollapsed = collapsed[group.name] && !searching;
          return (
            <section key={group.name} className="qbank2-group">
              <button type="button" className="qbank2-group-head" onClick={() => toggleChapter(group.name)}>
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                <span className="qbank2-group-name">{group.name}</span>
                <i className="qbank-pill">{group.items.length}</i>
              </button>
              {!isCollapsed && (
                <div className="qbank2-group-items">
                  {group.items.map((q) =>
                    editingId === q.id ? (
                      <QuestionEditRow key={q.id} question={q} onSave={(patch) => updateQuestion(q.id, patch)} onCancel={() => setEditingId(null)} />
                    ) : (
                      <article key={q.id} className="qbank-item">
                        <div className="qbank-item-main">
                          <span className="qbank-item-q">{q.question}</span>
                          <span className="qbank-item-tags">{q.topic} · {q.difficulty} · {q.bloomLevel}</span>
                        </div>
                        <button type="button" className="qbank-edit" aria-label="Edit question" onClick={() => setEditingId(q.id)}>
                          <Edit3 size={14} />
                        </button>
                        <button type="button" className="qbank-del" aria-label="Delete question" onClick={() => removeQuestion(q.id)}>
                          <Trash2 size={14} />
                        </button>
                      </article>
                    )
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function QuestionEditRow({ question, onSave, onCancel }) {
  const [d, setD] = useState(question);
  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));
  const setOpt = (i, v) => setD((p) => ({ ...p, options: p.options.map((o, idx) => (idx === i ? v : o)) }));

  return (
    <article className="qbank-edit-card">
      <label className="qbank-f"><span>Question</span>
        <textarea value={d.question} onChange={(e) => set("question", e.target.value)} />
      </label>
      <div className="qbank-f-row">
        <label className="qbank-f"><span>Chapter</span><input value={d.chapter} onChange={(e) => set("chapter", e.target.value)} /></label>
        <label className="qbank-f"><span>Topic</span><input value={d.topic} onChange={(e) => set("topic", e.target.value)} /></label>
      </div>
      <div className="qbank-opts">
        {d.options.map((o, i) => (
          <div key={i} className={`qbank-opt ${d.answer === LETTERS[i] ? "is-answer" : ""}`}>
            <button type="button" className="qbank-opt-key" onClick={() => set("answer", LETTERS[i])} title="Mark as correct answer">{LETTERS[i]}</button>
            <input value={o} onChange={(e) => setOpt(i, e.target.value)} />
          </div>
        ))}
      </div>
      <div className="qbank-f-row">
        <label className="qbank-f"><span>Correct</span>
          <select value={d.answer} onChange={(e) => set("answer", e.target.value)}>
            {d.options.map((_, i) => <option key={i} value={LETTERS[i]}>{LETTERS[i]}</option>)}
          </select>
        </label>
        <label className="qbank-f"><span>Difficulty</span>
          <select value={d.difficulty} onChange={(e) => set("difficulty", e.target.value)}>
            {Object.values(DIFFICULTIES).map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </label>
        <label className="qbank-f"><span>Bloom</span>
          <select value={d.bloomLevel} onChange={(e) => set("bloomLevel", e.target.value)}>
            {Object.values(BLOOM_LEVELS).map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </label>
      </div>
      <label className="qbank-f"><span>Explanation</span>
        <textarea value={d.explanation} onChange={(e) => set("explanation", e.target.value)} />
      </label>
      <label className="qbank-f"><span>Source</span><input value={d.source} onChange={(e) => set("source", e.target.value)} /></label>
      <div className="qbank-edit-actions">
        <button type="button" className="qbank-btn ghost" onClick={onCancel}><X size={14} /> Cancel</button>
        <button type="button" className="qbank-btn primary" onClick={() => onSave(d)} disabled={!d.question.trim()}><Save size={14} /> Save</button>
      </div>
    </article>
  );
}
