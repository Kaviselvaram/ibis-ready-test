import { BadgeService } from "../services/BadgeService.js";

// Student: own badge gallery (auto-awards any newly earned on read).
export const myBadges = async ({ user }) => {
  return await BadgeService.getForUser(user.sub);
};

export const badgeCatalog = async () => {
  return BadgeService.getCatalog();
};

// Admin: view a specific student's badges.
export const userBadges = async ({ req }) => {
  return await BadgeService.getForUser(req.params.id);
};

// Admin: manually grant a badge (backend-authorized only).
export const grantBadge = async ({ validatedData, user }) => {
  return await BadgeService.grant(validatedData.profile_id, validatedData.badge_key, user.sub);
};

// Admin: revoke a badge.
export const revokeBadge = async ({ validatedData }) => {
  return await BadgeService.revoke(validatedData.profile_id, validatedData.badge_key);
};
