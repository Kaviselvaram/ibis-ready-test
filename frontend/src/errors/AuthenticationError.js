export class AuthenticationError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'AuthenticationError';
    this.details = details;
  }
}
