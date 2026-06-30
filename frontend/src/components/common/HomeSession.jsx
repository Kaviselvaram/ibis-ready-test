import React, { useState } from 'react';
import Landing from './Landing';
import WhyIbisView from './WhyIbisView';

export default function HomeSession() {
  const [screen, setScreen] = useState("landing");

  if (screen === "why-ibis") {
    return <WhyIbisView onBack={() => setScreen("landing")} />;
  }

  return <Landing onWhyIbis={() => setScreen("why-ibis")} />;
}
