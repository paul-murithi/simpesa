export class BaseError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly developerHint?: string | undefined;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational = true,
    developerHint?: string,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.developerHint = developerHint;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class DomainError extends BaseError {
  constructor(message: string, statusCode: number = 400) {
    super(message, statusCode);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, developerHint?: string) {
    super(message, 400, true, developerHint);
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string, developerHint?: string) {
    super(message, 404, true, developerHint);
  }
}

export class ConflictError extends BaseError {
  constructor(message: string, developerHint?: string) {
    super(message, 409, true, developerHint);
  }
}

export class ExternalServiceError extends BaseError {
  constructor(
    message: string,
    public originalError?: unknown,
    developerHint?: string,
  ) {
    super(message, 502, true, developerHint);
  }
}

export class InvalidStateError extends DomainError {}
export class InsufficientFundsError extends DomainError {}
