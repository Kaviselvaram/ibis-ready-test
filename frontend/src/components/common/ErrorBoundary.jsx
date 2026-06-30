import React from 'react';
import * as Sentry from '@sentry/react';

const DefaultErrorFallback = ({ error, resetError }) => (
  <div className="p-6 border border-red-500/20 bg-red-500/10 rounded-xl text-center" style={{ margin: '2rem', padding: '2rem', background: '#301010', color: '#ffbaba', border: '1px solid #ff4040', borderRadius: '12px' }}>
    <h3 style={{ marginBottom: '1rem' }}>Something went wrong in this section</h3>
    <p style={{ marginBottom: '1rem', opacity: 0.8 }}>{error?.message || "An unexpected error occurred."}</p>
    <button onClick={resetError} style={{ padding: '0.5rem 1rem', background: '#ff4040', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
      Try Again
    </button>
  </div>
);

export const ErrorBoundary = ({ children, fallback }) => {
  return (
    <Sentry.ErrorBoundary fallback={fallback || <DefaultErrorFallback />}>
      {children}
    </Sentry.ErrorBoundary>
  );
};
