import { AppError } from "../errors/AppError.js";
import { verifyAccess, getSecureMediaLink, getProtectedVideo, getPricing } from "../services/ContentService.js";
import { logger } from "../utils/logger.js";

export const getPricingController = async () => {
  return getPricing();
};

export const getMedia = async ({ validatedData, user }) => {
  try {
    const { media_id } = validatedData;
    const simulatedProfile = { is_admin: user.role === 'admin' };
    const mockUser = { id: user.sub };

    const hasAccess = await verifyAccess(mockUser, simulatedProfile);
    if (!hasAccess) {
      throw new AppError("Active subscription required.", 403, "FORBIDDEN");
    }

    const mediaPayload = await getSecureMediaLink(media_id);
    return mediaPayload;
  } catch (error) {
    if (error.code === "MEDIA_NOT_FOUND" || error.message === "Media not found") {
      throw new AppError("Requested asset could not be located.", 404, "NOT_FOUND");
    }
    if (error.statusCode === 403) throw error;
    
    logger.error("Presentation Error Log:", error);
    throw new AppError("Internal processing malfunction.", 500, "INTERNAL_ERROR");
  }
};

export const getVideo = async ({ validatedData, user }) => {
  try {
    const { topic_id } = validatedData;
    const simulatedProfile = { is_admin: user.role === 'admin' };
    const mockUser = { id: user.sub };

    const hasAccess = await verifyAccess(mockUser, simulatedProfile);
    if (!hasAccess) {
      throw new AppError("Premium enrollment required to access video lectures.", 403, "FORBIDDEN");
    }

    const videoPayload = await getProtectedVideo(topic_id);
    return videoPayload;
  } catch (error) {
    if (error.code === "VIDEO_NOT_FOUND" || error.message === "Video not found") {
      throw new AppError("Resource item missing.", 404, "NOT_FOUND");
    }
    if (error.statusCode === 403) throw error; 

    logger.error("Video endpoint error:", error);
    throw new AppError("Video decoding pipeline failed.", 500, "INTERNAL_ERROR");
  }
};
