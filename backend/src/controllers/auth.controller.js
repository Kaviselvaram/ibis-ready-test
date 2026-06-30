import { login, refresh, logout, signup } from "../services/AuthService.js";

export const signupController = async ({ req, res, validatedData }) => {
  await signup(validatedData);
  const { accessToken, refreshToken } = await login({ email: validatedData.email, password: validatedData.password });
  
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return { access_token: accessToken };
};

export const loginController = async ({ req, res, validatedData }) => {
  const { accessToken, refreshToken } = await login(validatedData);
  
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return { access_token: accessToken };
};

export const refreshController = async ({ req, res }) => {
  const token = req.cookies?.refresh_token;
  const { accessToken, refreshToken } = await refresh(token);
  
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return { access_token: accessToken };
};

export const logoutController = async ({ req, res, user }) => {
  await logout(user?.jti);
  res.clearCookie("refresh_token");
  return { message: "Logged out successfully" };
};
