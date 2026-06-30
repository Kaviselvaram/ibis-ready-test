import { AppError } from "./AppError.js";
import { ERROR_CODES } from "../../../shared/contracts/v1/common/ErrorCodes.js";

export class RepositoryError extends Error {
  constructor(message, originalError = null, operation = 'unknown') {
    super(message);
    this.name = 'RepositoryError';
    this.originalError = originalError;
    this.operation = operation;
    Error.captureStackTrace(this, this.constructor);
  }

  toAppError() {
    // Prevent DB leakage by returning a generic message in production
    // But keep the original code for internal logging
    const isDev = process.env.NODE_ENV === 'development';
    return new AppError(
      isDev ? `Database Error: ${this.message}` : "An unexpected error occurred while accessing data.",
      500,
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      isDev ? { operation: this.operation, original: this.originalError?.message } : null
    );
  }
}
