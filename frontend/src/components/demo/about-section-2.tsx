import { TimelineContent } from "./timeline-animation";
import { RainbowButton } from "./rainbow-button";
import { AwardBadge } from "./award-badge";
import { useRef } from "react";

export default function AboutSection2() {
  const heroRef = useRef<HTMLDivElement>(null);
  
  const revealVariants = {
    visible: (i: number) => ({
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
    visible: (i: number) => ({
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
    <section className="py-32 px-4 why-ibis-screen-inline min-h-screen">
      <div className="max-w-6xl mx-auto" ref={heroRef}>
        <div className="flex flex-col lg:flex-row items-start gap-8">
          <div className="flex-1">
            <TimelineContent
              as="div"
              animationNum={0}
              timelineRef={heroRef}
              customVariants={revealVariants}
              className="why-ibis-intro"
              style={{
                fontFamily: "var(--handwriting)",
                lineHeight: "1.5",
                fontSize: "1.8rem",
                color: "#fff6ed"
              }}
            >
              <div className="why-ibis-title-heading">
                Hey, it's <span style={{ color: "#ffffff", borderBottom: "2px solid #ff7800" }}>Ganesh</span>—your teacher who's gonna make physics <span style={{ color: "#00f5a0" }}>easy</span> for you.
              </div>

              We are{" "}
              <TimelineContent
                as="span"
                animationNum={1}
                timelineRef={heroRef}
                customVariants={textVariants}
                className="glass-badge-reflect glass-badge-blue"
              >
                rebuilding
              </TimelineContent>{" "}
              physics learning to be <span style={{ color: "#ffe2bc", fontWeight: 700 }}>zero noise</span> and <span style={{ color: "#00f5a0", fontWeight: 700 }}>board optimized</span>. My mission is to build boardroom confidence and{" "}
              <TimelineContent
                as="span"
                animationNum={2}
                timelineRef={heroRef}
                customVariants={textVariants}
                className="glass-badge-reflect glass-badge-orange"
              >
                demystify
              </TimelineContent>{" "}
              how complex concepts can{" "}
              <TimelineContent
                as="span"
                animationNum={3}
                timelineRef={heroRef}
                customVariants={textVariants}
                className="glass-badge-reflect glass-badge-green"
              >
                click for you.
              </TimelineContent>{" "}
              Through step-by-step{" "}
              <TimelineContent
                as="span"
                animationNum={2}
                timelineRef={heroRef}
                customVariants={textVariants}
                className="glass-badge-reflect glass-badge-gold"
              >
                visual patterns
              </TimelineContent>
              , intuitive derivations, and hand-tailored{" "}
              <TimelineContent
                as="span"
                animationNum={3}
                timelineRef={heroRef}
                customVariants={textVariants}
                className="glass-badge-reflect glass-badge-purple"
              >
                JEE/NEET study tracks
              </TimelineContent>
              , we turn intimidating equations into natural reflexes. Every class is engineered to spark deep curiosity,{" "}
              <TimelineContent
                as="span"
                animationNum={3}
                timelineRef={heroRef}
                customVariants={textVariants}
                className="glass-badge-reflect glass-badge-pink"
              >
                dismantle exam anxiety
              </TimelineContent>
              , and make top-tier mentoring accessible.
            </TimelineContent>

            <div style={{ marginTop: "32px" }}>
              <TimelineContent
                as="div"
                animationNum={4}
                timelineRef={heroRef}
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
