import { useNavigationController } from "../../hooks/useNavigationController";
import React, { useRef } from 'react';
import { Menu, ArrowLeft, GraduationCap, TrendingUp, Users } from 'lucide-react';
import { TimelineContent } from '../ui/timeline-animation';
import { AwardBadge } from '../ui/award-badge';
import { Brand, Button } from '../ui/LegacyUI';
import TesplePill from '../ui/TesplePill';

// Right-rail credibility cards — each a distinct accent while staying on-palette.
const ACHIEVEMENTS = [
  { icon: GraduationCap, value: "10+", label: "Years Teaching", accent: "clay" },
  { icon: TrendingUp, value: "98%", label: "Board Success Rate", accent: "sage" },
  { icon: Users, value: "5,000+", label: "Students Mentored", accent: "gold" }
];

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

      {/* Two-column: text-heavy left, visual credibility rail on the right. */}
      <div className="why-ibis-split2">
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
          </div>
        </div>

        {/* Right credibility rail: existing award badges + new achievement cards. */}
        <TimelineContent
          as="aside"
          animationNum={2}
          timelineRef={whyIbisHeroRef}
          customVariants={textVariants}
          className="why-ibis-rail"
        >
          <div className="why-ibis-awards">
            <AwardBadge type="cbse-coaching" variant="transparent" />
            <AwardBadge type="harvard-leadership" variant="transparent" />
          </div>
          <div className="why-ach-grid">
            {ACHIEVEMENTS.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.label} className={`why-ach-card accent-${a.accent}`}>
                  <span className="why-ach-icon"><Icon size={20} /></span>
                  <strong className="why-ach-value">{a.value}</strong>
                  <span className="why-ach-label">{a.label}</span>
                </div>
              );
            })}
          </div>
        </TimelineContent>
      </div>
    </section>
  );
}
