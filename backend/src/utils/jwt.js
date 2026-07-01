import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../errors/AppError.js";
import crypto from "crypto";

export const generateTokens = (user, role = "student", plan = "free", paid_until = null, name = null) => {
  const jti = crypto.randomUUID();
  const payload = {
    sub: user.id,
    name: name || user.user_metadata?.full_name || null,
    role,
    plan,
    paid_until: paid_until ? Math.floor(new Date(paid_until).getTime() / 1000) : null,
    jti
  };

  // HS256 is symmetrically signed using the secret key in env
  const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m', algorithm: 'HS256' });
  const refreshToken = jwt.sign({ sub: user.id, jti }, env.JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' });

  return { accessToken, refreshToken, jti };
};

export const verifyAccessToken = async (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          reject(new AppError("Token expired", 401, "TOKEN_EXPIRED"));
        } else {
          reject(new AppError("Invalid token", 401, "UNAUTHORIZED"));
        }
      } else {
        resolve(decoded);
      }
    });
  });
};

export const verifyRefreshToken = async (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }, (err, decoded) => {
      if (err) {
        reject(new AppError("Invalid refresh token", 401, "UNAUTHORIZED"));
      } else {
        resolve(decoded);
      }
    });
  });
};
