import { UserService } from "../services/UserService.js";

export const getMe = async ({ user }) => {
  return await UserService.getMe(user.sub);
};

export const deleteUserAccount = async ({ req, res, user, validatedData }) => {
  return await UserService.deleteUserAccount(user.sub, user.jti);
};
