import React, { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  ArrowLeft, ArrowRight, Download, ZoomIn, ZoomOut,
  BookOpen, Square, Loader2, FileWarning, Maximize2
} from "lucide-react";
import { Button } from "../ui/LegacyUI";
import { motion, AnimatePresence } from "framer-motion";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

// Renders a single PDF page to a crisp (DPR-aware) canvas. Cancels an in-flight
// render if the page/width changes so fast scrubbing never leaks render tasks.
function PdfPage({ pdf, pageNumber, targetWidth }) {
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!pdf || !targetWidth) return;
    let cancelled = false;
    let renderTask = null;

    (async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;
        const base = page.getViewport({ scale: 1 });
        const scale = targetWidth / base.width;
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        const ctx = canvas.getContext("2d");
        renderTask = page.render({
          canvasContext: ctx,
          viewport,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null
        });
        await renderTask.promise;
        if (!cancelled) setReady(true);
      } catch (err) {
        // RenderingCancelledException is expected on fast nav — ignore.
        if (!cancelled && err?.name !== "RenderingCancelledException") setReady(true);
      }
    })();

    return () => {
      cancelled = true;
      try { renderTask?.cancel(); } catch { /* no-op */ }
    };
  }, [pdf, pageNumber, targetWidth]);

  return (
    <div className="pdf-page-wrap">
      {!ready && <div className="pdf-page-skeleton" style={{ width: targetWidth, aspectRatio: "1 / 1.414" }} />}
      <canvas ref={canvasRef} className={`pdf-page-canvas ${ready ? "shown" : ""}`} />
      <span className="pdf-page-num">{pageNumber}</span>
    </div>
  );
}

/**
 * Premium PDF reader for the student Notes tab.
 * - Single-page and double-page (spread) views.
 * - Real page navigation (buttons + keyboard arrows), page counter, zoom,
 *   download, fullscreen, loading skeletons and a friendly failure fallback.
 * The `url` is the Supabase Storage public URL persisted by the admin uploader.
 */
export default function PdfReader({ url, title }) {
  const scrollRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);              // leftmost visible page (1-based)
  const [mode, setMode] = useState("single");        // 'single' | 'double'
  const [zoom, setZoom] = useState(1);               // multiplier over the fit width
  const [status, setStatus] = useState("loading");   // 'loading' | 'ready' | 'error'
  const [viewportWidth, setViewportWidth] = useState(0);

  // Load the document.
  useEffect(() => {
    if (!url) { setStatus("error"); return; }
    let cancelled = false;
    setStatus("loading");
    setPage(1);
    const task = pdfjsLib.getDocument({ url });
    task.promise.then((doc) => {
      if (cancelled) return;
      setPdf(doc);
      setNumPages(doc.numPages);
      setStatus("ready");
    }).catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; try { task.destroy?.(); } catch { /* no-op */ } };
  }, [url]);

  // Track the reader's available width so pages fit without horizontal scroll.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setViewportWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [status]);

  const step = mode === "double" ? 2 : 1;
  const goPrev = useCallback(() => setPage((p) => Math.max(1, p - step)), [step]);
  const goNext = useCallback(() => setPage((p) => Math.min(numPages, p + step)), [step, numPages]);

  // Keyboard navigation.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft" || e.key === "PageUp") goPrev();
      else if (e.key === "ArrowRight" || e.key === "PageDown") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext]);

  // Keep the left page even in double mode so spreads stay paired.
  const setModeSafe = (m) => {
    setMode(m);
    if (m === "double") setPage((p) => (p % 2 === 0 ? p - 1 : p));
  };

  const zoomIn = () => setZoom((z) => Math.min(z + 0.2, 2.4));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.6));

  const toggleFullscreen = () => {
    const el = scrollRef.current?.closest(".pdf-reader");
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.();
  };

  // Compute the per-page target render width from the viewport + zoom.
  const gap = 22;
  const perPage = mode === "double" ? (viewportWidth - gap * 3) / 2 : viewportWidth - gap * 2;
  const targetWidth = Math.max(180, Math.floor(perPage * zoom));

  const visiblePages = [];
  if (status === "ready") {
    visiblePages.push(page);
    if (mode === "double" && page + 1 <= numPages) visiblePages.push(page + 1);
  }

  const atStart = page <= 1;
  const atEnd = mode === "double" ? page + 1 >= numPages : page >= numPages;

  return (
    <div className="pdf-reader">
      <div className="pdf-reader-toolbar">
        <div className="prt-left">
          <BookOpen size={15} />
          <span className="prt-title" title={title}>{title || "Notes"}</span>
        </div>

        <div className="prt-center">
          <Button className="icon-btn" aria-label="Previous page" onClick={goPrev} disabled={atStart || status !== "ready"}>
            <ArrowLeft size={16} />
          </Button>
          <span className="prt-counter">
            {status === "ready" ? (
              mode === "double" && visiblePages.length === 2
                ? `${page}–${page + 1} / ${numPages}`
                : `${page} / ${numPages}`
            ) : "—"}
          </span>
          <Button className="icon-btn" aria-label="Next page" onClick={goNext} disabled={atEnd || status !== "ready"}>
            <ArrowRight size={16} />
          </Button>
        </div>

        <div className="prt-right">
          <div className="prt-viewtoggle" role="group" aria-label="Page view">
            <button className={mode === "single" ? "active" : ""} onClick={() => setModeSafe("single")} title="Single page">
              <Square size={14} /> Single
            </button>
            <button className={mode === "double" ? "active" : ""} onClick={() => setModeSafe("double")} title="Double page">
              <BookOpen size={14} /> Double
            </button>
          </div>
          <Button className="icon-btn" aria-label="Zoom out" onClick={zoomOut} disabled={status !== "ready"}><ZoomOut size={16} /></Button>
          <Button className="icon-btn" aria-label="Zoom in" onClick={zoomIn} disabled={status !== "ready"}><ZoomIn size={16} /></Button>
          <Button className="icon-btn" aria-label="Fullscreen" onClick={toggleFullscreen}><Maximize2 size={16} /></Button>
          <a className="prt-download icon-btn" href={url} target="_blank" rel="noreferrer" aria-label="Download PDF" title="Download">
            <Download size={16} />
          </a>
        </div>
      </div>

      <div className="pdf-reader-stage" ref={scrollRef}>
        {status === "loading" && (
          <div className="pdf-reader-loading">
            <Loader2 className="spin" size={26} />
            <span>Loading notes…</span>
          </div>
        )}
        {status === "error" && (
          <div className="pdf-reader-error">
            <FileWarning size={30} />
            <h3>We couldn’t open these notes</h3>
            <p>The file may still be processing. Try again in a moment, or open it in a new tab.</p>
            {url && <a className="pdf-reader-error-link" href={url} target="_blank" rel="noreferrer">Open in new tab</a>}
          </div>
        )}
        {status === "ready" && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${mode}-${page}`}
              className={`pdf-spread ${mode}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              {visiblePages.map((pn) => (
                <PdfPage key={pn} pdf={pdf} pageNumber={pn} targetWidth={targetWidth} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
