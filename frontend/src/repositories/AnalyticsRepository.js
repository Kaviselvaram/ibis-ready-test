import { api } from "../api/ApiClient";

export const AnalyticsRepository = {
  // Admin dashboard snapshot. Pass force=true from the Refresh button so the
  // backend bypasses its short cache and returns live numbers.
  getAnalytics: (force = false) => api.get(`/analytics${force ? "?force=true" : ""}`),

  // Fire-and-forget engagement logging — never throws into the caller.
  logEvent: (payload) => api.post("/analytics/event", payload).catch(() => {})
};

// Convenience wrapper used by student content views (notes/videos). Silent on
// failure so it can never disrupt the reading/watching experience.
export function logActivity(event_type, extra = {}) {
  try {
    AnalyticsRepository.logEvent({ event_type, ...extra });
  } catch {
    /* no-op */
  }
}
