import React, { useState, Suspense } from 'react';
import Landing from './Landing';

// The mentor page is loaded on demand — it isn't needed for the landing's first paint.
const WhyIbisView = React.lazy(() => import('./WhyIbisView'));

export default function HomeSession() {
  const [screen, setScreen] = useState("landing");

  if (screen === "why-ibis") {
    return (
      <Suspense fallback={null}>
        <WhyIbisView onBack={() => setScreen("landing")} />
      </Suspense>
    );
  }

  return <Landing onWhyIbis={() => setScreen("why-ibis")} />;
}
