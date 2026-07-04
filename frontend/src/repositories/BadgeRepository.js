import { api } from "../api/ApiClient";

export const BadgeRepository = {
  getMine: () => api.get("/badges/me"),
  getCatalog: () => api.get("/badges/catalog"),
  getForUser: (id) => api.get(`/badges/user/${id}`),      // admin
  grant: (profile_id, badge_key) => api.post("/badges/grant", { profile_id, badge_key }),   // admin
  revoke: (profile_id, badge_key) => api.post("/badges/revoke", { profile_id, badge_key })  // admin
};
