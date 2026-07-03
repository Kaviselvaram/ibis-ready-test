import { useNavigationController } from "../../hooks/useNavigationController";
import React, { useRef } from 'react';
import { Menu, ArrowLeft } from 'lucide-react';
import { TimelineContent } from '../ui/timeline-animation';
import { AwardBadge } from '../ui/award-badge';
import { Brand, Button } from '../ui/LegacyUI';
import TesplePill from '../ui/TesplePill';

export default function WhyIbisView({ onBack: sessionOnBack }) {
  const { goToHome } = useNavigationController();
  const onBack = sessionOnBack || goToHome;

  const whyIbisHeroRef = useRef(null);

  const revealVariants = {
    visible: (i) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 1.5,
        duration: 0.7,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: 40,
      opacity: 0,
    },
  };

  const textVariants = {
    visible: (i) => ({
      filter: "blur(0px)",
      opacity: 1,
      transition: {
        delay: i * 0.3,
        duration: 0.7,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      opacity: 0,
    },
  };

  return (
    <section className="why-ibis-screen" ref={whyIbisHeroRef}>
      {/* Floating Logo Top-Left */}
      <div style={{ position: "absolute", top: "24px", left: "24px", zIndex: 50 }}>
        <Brand compact={true} />
      </div>

      {/* Floating Top-Right Actions */}
      <div style={{ position: "absolute", top: "24px", right: "24px", zIndex: 50, display: "flex", alignItems: "center", gap: "16px" }}>
        <button className="landing-topbtn" onClick={onBack}><ArrowLeft size={15} /> Home</button>
        <TesplePill />
        <Button className="icon-btn subtle" style={{ visibility: "hidden" }} aria-hidden="true"><Menu size={18} /></Button>
      </div>

      {/* Photo removed — full-width editorial layout centred on the Yibis story. */}
      <div className="why-ibis-single-layout">
        <div className="why-ibis-stage">
          <div className="why-ibis-glass-card yibis-card">
            <span className="yibis-kicker" aria-label="Yibis mentor">
              <span className="yibis-dot" /> Yibis · your mentor
            </span>

            <TimelineContent
              as="div"
              animationNum={0}
              timelineRef={whyIbisHeroRef}
              customVariants={revealVariants}
              className="why-ibis-intro"
            >
              <div className="why-ibis-title-heading">
                Hey, it's <span>Ganesh</span>—your teacher who's gonna make physics <i>easy</i> for you.
              </div>

              <div className="why-ibis-story-copy">
                We are{" "}
                <span className="glass-badge-reflect glass-badge-blue">rebuilding</span>{" "}
                physics learning to be <strong className="glass-badge-reflect glass-badge-cream">zero noise</strong> and{" "}
                <span className="why-soft-emphasis glass-badge-reflect glass-badge-teal">board optimized</span>. My mission is to build boardroom confidence
                and make complex concepts{" "}
                <TimelineContent
                  as="span"
                  animationNum={2}
                  timelineRef={whyIbisHeroRef}
                  customVariants={textVariants}
                  className="why-micro-chip"
                >
                  click
                </TimelineContent>{" "}
                for you. Through step-by-step{" "}
                <span className="glass-badge-reflect glass-badge-gold">visual patterns</span>, intuitive derivations, and hand-tailored{" "}
                <span className="glass-badge-reflect glass-badge-purple">study tracks</span>,
                we turn intimidating equations into natural reflexes. Every class is engineered to spark curiosity,
                reduce{" "}
                <span className="glass-badge-reflect glass-badge-pink">exam anxiety</span>, and make top-tier mentoring accessible.
              </div>
            </TimelineContent>

            <div style={{ marginTop: "32px" }}>
              <TimelineContent
                as="div"
                animationNum={4}
                timelineRef={whyIbisHeroRef}
                customVariants={textVariants}
                style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center", justifyContent: "flex-start" }}
              >
                <AwardBadge type="cbse-coaching" variant="transparent" />
                <AwardBadge type="harvard-leadership" variant="transparent" />
              </TimelineContent>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
