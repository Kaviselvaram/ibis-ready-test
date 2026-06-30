export class ApiError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.details = details;
  }
}
