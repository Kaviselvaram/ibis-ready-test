export class NotFoundError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'NotFoundError';
    this.details = details;
  }
}
