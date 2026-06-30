export class RepositoryError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'RepositoryError';
    this.details = details;
  }
}
