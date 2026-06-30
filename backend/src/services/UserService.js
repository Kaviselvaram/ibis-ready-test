import crypto from "crypto";
import { getRedisClient } from "../config/redis.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { AppError } from "../errors/AppError.js";

// Cryptographically secure hash for tombstone
const hashUserId = (userId) => {
  return crypto.createHash('sha256').update(userId).digest('hex');
};

export const UserService = {
  deleteUserAccount: async (userId, jti) => {
    const redis = getRedisClient();

    if (redis && jti) {
      // 1. Revoke active session
      await redis.setex(`revoked:${jti}`, 7 * 24 * 60 * 60, "true");

      // 2. Purge active test attempts
      const attemptKeys = await redis.keys(`shuffle:${userId}:*`);
      if (attemptKeys.length) await redis.del(attemptKeys);
    }

    // 3. Delete Supabase Auth user (Cascades to profiles, test_attempts, etc)
    const { error } = await UserRepository.deleteUser(userId);
    if (error) throw new AppError("Account deletion failed", 500, "DELETE_FAILED");

    // 4. Audit log tombstone for DPDP compliance
    await UserRepository.logDeletion(hashUserId(userId));

    return { status: "deleted" };
  }
};
