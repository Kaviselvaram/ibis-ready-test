import React, { useEffect, useState } from "react";
import { X, Award, Plus, Minus, Loader2 } from "lucide-react";
import { BadgeRepository } from "../../repositories/BadgeRepository";
import { BadgeMedallion } from "../student/BadgeGallery";
import { useToast, friendlyMessage } from "../../contexts/ToastContext";

// Admin-only badge management for a single student (#2). Auto-earned badges show
// as earned; admins can additionally grant or revoke any badge. All mutations go
// through the admin-guarded /badges endpoints — students can never reach these.
export default function BadgeAdminModal({ student, onClose }) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState(null);

  const load = () => {
    setError("");
    BadgeRepository.getForUser(student.id)
      .then(setData)
      .catch((e) => setError(friendlyMessage(e, "Couldn’t load this student’s badges.")));
  };
  useEffect(load, [student.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async (badge) => {
    if (busyKey) return;
    setBusyKey(badge.key);
    try {
      if (badge.earned) {
        await BadgeRepository.revoke(student.id, badge.key);
        toast.success(`Revoked “${badge.label}”`);
      } else {
        await BadgeRepository.grant(student.id, badge.key);
        toast.success(`Granted “${badge.label}”`);
      }
      const fresh = await BadgeRepository.getForUser(student.id);
      setData(fresh);
    } catch (e) {
      toast.error(friendlyMessage(e, "Couldn’t update the badge."));
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal badge-admin-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="smx-modal-close" aria-label="Close" onClick={onClose}><X size={18} /></button>
        <div className="badge-gallery-head">
          <div>
            <h2><Award size={20} /> Badges · {student.name || student.email}</h2>
            <p>{data ? `${data.earnedCount} of ${data.total} earned` : "Loading…"} · grant or revoke manually.</p>
          </div>
        </div>

        {error && <div className="tc-error">{error}</div>}

        <div className="badge-admin-grid">
          {(data?.badges || []).map((b) => (
            <div key={b.key} className={`badge-admin-item ${b.earned ? "earned" : ""}`}>
              <BadgeMedallion badge={b} size={54} />
              <div className="badge-admin-info">
                <strong>{b.label}</strong>
                <small>{b.description}</small>
                <span className={`badge-rarity-tag rarity-${b.rarity} inline`}>{b.rarity}</span>
              </div>
              <button
                type="button"
                className={`badge-admin-btn ${b.earned ? "revoke" : "grant"}`}
                disabled={busyKey === b.key}
                onClick={() => toggle(b)}
              >
                {busyKey === b.key ? <Loader2 size={14} className="spin" /> : b.earned ? <Minus size={14} /> : <Plus size={14} />}
                {b.earned ? "Revoke" : "Grant"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
