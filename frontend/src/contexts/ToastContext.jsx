import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { CheckCircle2, AlertCircle, Info, Loader2, X } from "lucide-react";

const ToastContext = createContext(null);

let idSeq = 0;

// Turn any thrown error into a clear, user-facing sentence. The API layer wraps
// server errors as RepositoryError with the real message on `.details.message`.
export function friendlyMessage(err, fallback = "Something went wrong. Please try again.") {
  if (!err) return fallback;
  if (typeof err === "string") return err;
  const raw = err?.details?.message || err?.message || "";
  if (!raw || raw === "API Error" || raw === "API request failed") return fallback;
  if (/Failed to fetch|NetworkError|timeout|timed out/i.test(raw)) {
    return "Network problem — check your connection and try again.";
  }
  if (/session expired|unauthor/i.test(raw)) return "Your session expired. Please log in again.";
  return raw;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    if (timers.current[id]) { clearTimeout(timers.current[id]); delete timers.current[id]; }
  }, []);

  const push = useCallback((toast) => {
    const id = ++idSeq;
    setToasts((list) => [...list, { id, ...toast }]);
    if (toast.duration !== 0) {
      timers.current[id] = setTimeout(() => dismiss(id), toast.duration || 3800);
    }
    return id;
  }, [dismiss]);

  const update = useCallback((id, patch) => {
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    if (patch.duration !== 0 && patch.duration !== undefined) {
      if (timers.current[id]) clearTimeout(timers.current[id]);
      timers.current[id] = setTimeout(() => dismiss(id), patch.duration);
    }
  }, [dismiss]);

  const success = useCallback((message) => push({ type: "success", message }), [push]);
  const error = useCallback((message) => push({ type: "error", message, duration: 5200 }), [push]);
  const info = useCallback((message) => push({ type: "info", message }), [push]);

  // Wrap an async operation with loading → success/error toasts. Returns the
  // operation's result, and re-throws so callers can still branch on failure.
  const promise = useCallback(async (op, { loading, success: okMsg, error: errMsg } = {}) => {
    const id = push({ type: "loading", message: loading || "Working…", duration: 0 });
    try {
      const result = await (typeof op === "function" ? op() : op);
      const msg = typeof okMsg === "function" ? okMsg(result) : (okMsg || "Done");
      update(id, { type: "success", message: msg, duration: 3200 });
      return result;
    } catch (e) {
      const msg = typeof errMsg === "function" ? errMsg(e) : (errMsg || friendlyMessage(e));
      update(id, { type: "error", message: msg, duration: 5200 });
      throw e;
    }
  }, [push, update]);

  const value = { success, error, info, promise, dismiss };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  loading: Loader2
};

function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="toast-viewport" role="region" aria-label="Notifications">
      {toasts.map((t) => {
        const Icon = ICONS[t.type] || Info;
        return (
          <div key={t.id} className={`toast toast-${t.type}`} role="status">
            <span className={`toast-icon ${t.type === "loading" ? "spin" : ""}`}><Icon size={18} /></span>
            <span className="toast-message">{t.message}</span>
            {t.type !== "loading" && (
              <button className="toast-close" aria-label="Dismiss" onClick={() => onDismiss(t.id)}><X size={14} /></button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Safe no-op fallback so a missing provider never crashes an action.
    return { success: () => {}, error: () => {}, info: () => {}, promise: async (op) => (typeof op === "function" ? op() : op), dismiss: () => {} };
  }
  return ctx;
}
