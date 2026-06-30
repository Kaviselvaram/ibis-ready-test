import React from "react";
import { Check } from "lucide-react";

export const ScaleRotateWrapper = ({ children, needsScale, isPortrait, isEmbedded }) => {
  if (isEmbedded) {
    return (
      <div className="w-full h-full min-h-screen bg-neutral-900 text-neutral-50 font-sans overflow-x-hidden selection:bg-rose-500/30 selection:text-rose-200">
        <div className="w-full h-full p-4">{children}</div>
      </div>
    );
  }

  if (!needsScale) {
    return (
      <div className="w-full h-full min-h-screen bg-transparent text-neutral-50 font-sans overflow-x-hidden selection:bg-rose-500/30 selection:text-rose-200 flex items-center justify-center">
        <div className="w-full max-w-[1280px] h-[720px] aspect-video glass-panel overflow-hidden relative rounded-2xl shadow-2xl border border-white/10 mx-auto">
          {children}
        </div>
      </div>
    );
  }

  if (isPortrait) {
    return (
      <div className="fixed inset-0 w-full h-full bg-neutral-950 flex items-center justify-center text-white overflow-hidden font-sans">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at center, #6366f1 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative text-center p-8 glass-panel max-w-sm">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center animate-bounce-slow">
              <svg className="w-8 h-8 text-white rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-3 tracking-tight">Rotate Device</h2>
          <p className="text-neutral-400 text-sm leading-relaxed mb-6">Ibis Physics is designed for immersive widescreen learning. Please rotate your device to landscape mode.</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-300">
            <Check size={14} className="text-emerald-400" />
            <span>Orientation Lock Recommended</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-neutral-900 flex items-center justify-center overflow-hidden font-sans">
      <div className="transform-origin-center scale-[min(100vw/1280,100vh/720)]">
        <div className="w-[1280px] h-[720px] bg-neutral-950 relative overflow-hidden shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  );
};
