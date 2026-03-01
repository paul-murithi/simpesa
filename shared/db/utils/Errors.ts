export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends DomainError {}
export class InvalidStateError extends DomainError {}
export class InsufficientFundsError extends DomainError {}
