import { useParams } from "react-router-dom";
import { useNavigationController } from "../../hooks/useNavigationController";
import React, { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { Brand, GlassButton } from '../ui/LegacyUI';

export default function LegalInfoPage() {
  const { page } = useParams();
  const { goToHome } = useNavigationController();
  const goBackFromLegal = goToHome;
  const [activePage, setActivePage] = useState(page || "privacy");
  const content = {
    privacy: {
      title: "Privacy Policy",
      eyebrow: "Student data, handled with restraint",
      summary: "Ibis Physics collects only the details needed to run your learning portal, plan access, progress tracking, batch support, and payment flow.",
      paragraphs: [
        "Your name, email, batch details, teacher code, and payment status are used only to identify your account and keep your learning access accurate.",
        "Progress signals such as lessons opened, tests attempted, notes viewed, and study history help the portal make your preparation clearer and more personal.",
        "We do not sell student data or turn private progress into public ranking. Access stays limited to the student, mentor, and support workflows that genuinely need it."
      ],
      promise: "The principle is simple: keep the portal useful, keep the data minimal, and keep every student’s academic trail private."
    },
    terms: {
      title: "Terms of Service",
      eyebrow: "Clear rules for a focused classroom",
      summary: "By using Ibis Physics, you agree to use the lessons, notes, tests, and portal tools for your own preparation and assigned batch access.",
      paragraphs: [
        "Your account is personal to you. Sharing credentials, batch codes, paid lessons, notes, or recorded material can lead to paused or removed access.",
        "Some checkout and portal flows may be demos while the platform is being built. Final payments should happen only through verified Ibis Physics channels.",
        "All lessons, PDFs, videos, tests, and study tracks are created for enrolled students. They are learning material, not content for redistribution."
      ],
      promise: "The goal is a serious learning space: respectful use, honest access, and no noise around the work that matters."
    },
    contact: {
      title: "Contact",
      eyebrow: "Support that knows the classroom",
      summary: "For batch access, payment help, account recovery, or study guidance, contact Ibis Physics using the same email connected to your portal.",
      paragraphs: [
        "For account or payment help, send your name, registered email, and batch name if you have one. That gives support enough context to respond properly.",
        "For a lesson, test, or notes issue, mention the chapter and the action you were trying to complete. Clear context helps us fix the right thing faster.",
        "For parent or school enquiries, include the student’s class details and a callback number so the response can stay practical and specific."
      ],
      promise: "Support is designed to be direct and practical, so students get back to physics instead of chasing portal confusion."
    }
  };
  const active = content[activePage] || content.privacy;

  return (
    <section className={`legal-screen legal-${activePage}`}>
      <div className="legal-layout">
        <header className="legal-topbar">
          <GlassButton type="button" size="icon" className="legal-back-btn" aria-label="Back to signup" onClick={goBackFromLegal}>
            <ArrowLeft size={18} />
          </GlassButton>
          <Brand compact />
          <nav className="legal-actions" aria-label="Legal sections">
            <button type="button" className={activePage === "privacy" ? "active" : ""} onClick={() => setActivePage("privacy")}>Privacy</button>
            <button type="button" className={activePage === "terms" ? "active" : ""} onClick={() => setActivePage("terms")}>Terms</button>
            <button type="button" className={activePage === "contact" ? "active" : ""} onClick={() => setActivePage("contact")}>Contact</button>
          </nav>
        </header>

        <div className="legal-hero" key={activePage}>
          <div className="legal-title-block">
            <h1>{active.title}</h1>
            <p>{active.summary}</p>
          </div>

          <div className="legal-prose">
            {active.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="legal-closing">
            <Check size={18} />
            <p>{active.promise}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

