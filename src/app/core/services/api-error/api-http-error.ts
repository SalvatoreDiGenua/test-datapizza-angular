export class ApiHttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly url?: string,
  ) {
    super(message);
    this.name = 'ApiHttpError';
  }
}
