import { AppError } from "../errors/AppError.js";

export const requireAdmin = (req, res, next) => {
  if (!req.profile || req.profile.is_admin !== true) {
    return next(new AppError("Forbidden: Admin access required", 403, "FORBIDDEN"));
  }
  next();
};
