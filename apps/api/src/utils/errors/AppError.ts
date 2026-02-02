export class AppError extends Error {
  public statusCode: number;
  public responseCode: string;
  public developerHint?: string | undefined;

  constructor(
    statusCode: number,
    responseDescription: string,
    developerHint?: string,
  ) {
    super(responseDescription);
    this.statusCode = statusCode;
    this.responseCode = String(statusCode);
    this.developerHint = developerHint;
  }
}
