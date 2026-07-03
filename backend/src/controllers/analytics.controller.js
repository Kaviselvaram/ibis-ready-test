import { AnalyticsService } from "../services/AnalyticsService.js";
import { logger } from "../utils/logger.js";

// Admin-only analytics snapshot. `?force=true` bypasses the short cache so the
// dashboard's Refresh button always returns live numbers.
export const getAnalytics = async ({ validatedData }) => {
  const force = validatedData?.force === "true";
  return await AnalyticsService.getAnalytics({ force });
};

// Fire-and-forget engagement logging. Never fails the caller's action: any
// error is swallowed and reported as a soft ok so the student UI is unaffected.
export const logEvent = async ({ validatedData, user }) => {
  try {
    await AnalyticsService.logEvent({
      profile_id: user?.sub || null,
      event_type: validatedData.event_type,
      chapter_id: validatedData.chapter_id || null,
      topic_id: validatedData.topic_id || null,
      metadata: validatedData.metadata || null
    });
  } catch (e) {
    logger.warn("activity_events log failed (non-critical):", { error: e.message });
  }
  return { ok: true };
};
