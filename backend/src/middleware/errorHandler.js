import { AppError } from "../errors/AppError.js";
import { RepositoryError } from "../errors/RepositoryError.js";
import { logger } from "../utils/logger.js";
import { FailureResponse } from "../../../shared/contracts/v1/common/ApiResponse.js";
import { ERROR_CODES } from "../../../shared/contracts/v1/common/ErrorCodes.js";

export const errorHandler = (err, req, res, next) => {
  if (err instanceof RepositoryError) {
    logger.error(`[${req.requestId}] Repository Error:`, { message: err.message, operation: err.operation, original: err.originalError });
    err = err.toAppError();
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(`[${req.requestId}] Operational Error:`, { message: err.message, stack: err.stack, details: err.details });
    } else {
      logger.warn(`[${req.requestId}] App Error:`, { message: err.message, code: err.code, details: err.details });
    }
    
    return res.status(err.statusCode).json({
      ...FailureResponse(err.message, err.code, err.details),
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      }
    });
  }

  logger.error(`[${req.requestId}] Unhandled Error:`, { message: err.message, stack: err.stack });
  
  return res.status(500).json({
    ...FailureResponse(
      "An unexpected error occurred on the server.", 
      ERROR_CODES.INTERNAL_SERVER_ERROR, 
      process.env.NODE_ENV === 'development' ? err.message : null
    ),
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    }
  });
};
