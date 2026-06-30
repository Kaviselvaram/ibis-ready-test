import React from 'react';
import { useNavigationController } from '../hooks/useNavigationController';

export const RouteFallback = () => {
  const { goToHome } = useNavigationController();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-8 bg-neutral-900 text-neutral-50 font-sans">
      <div className="glass-panel p-12 max-w-lg rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
        <h1 className="text-6xl font-black text-white tracking-tighter mb-4 opacity-50">404</h1>
        <h2 className="text-2xl font-bold mb-4 text-white">Route Not Found</h2>
        <p className="text-neutral-400 mb-8 leading-relaxed">
          The requested trajectory is undefined in the current physical model. Please recalibrate your navigation.
        </p>
        <button 
          onClick={goToHome}
          className="px-6 py-3 rounded-full bg-white text-black font-semibold tracking-tight hover:bg-neutral-200 transition-colors inline-flex items-center gap-2"
        >
          Return to Base
        </button>
      </div>
    </div>
  );
};
