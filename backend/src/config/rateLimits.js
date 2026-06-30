export const RATE_LIMITS = {
  GENERAL: { max: 120, windowMs: 60000, byUser: true, name: "general" },
  AUTH: { max: 10, windowMs: 60000, byUser: false, name: "auth" },
  TOTP: { max: 5, windowMs: 600000, byUser: true, name: "totp" },
  SUBMIT: { max: 5, windowMs: 60000, byUser: true, name: "submit" },
  CONTENT: { max: 30, windowMs: 60000, byUser: true, name: "content" },
  WEBHOOK: { max: 50, windowMs: 60000, byUser: false, name: "webhook" }
};
