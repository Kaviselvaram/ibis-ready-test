export class AuthorizationError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'AuthorizationError';
    this.details = details;
  }
}
