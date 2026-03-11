import { describe, it, expect } from "vitest";
import {
  BaseError,
  DomainError,
  ValidationError,
  NotFoundError,
  ConflictError,
  ExternalServiceError,
  InvalidStateError,
  InsufficientFundsError,
} from "@app/utils";

describe("Error classes", () => {
  it("creates BaseError correctly", () => {
    const err = new BaseError("Boom", 500, true, "debug hint");

    expect(err.message).toBe("Boom");
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(true);
    expect(err.developerHint).toBe("debug hint");
    expect(err).toBeInstanceOf(Error);
  });

  it("creates derived errors with correct status codes", () => {
    const validation = new ValidationError("Invalid", "bad input");
    const notFound = new NotFoundError("Missing");
    const conflict = new ConflictError("Duplicate");
    const domain = new DomainError("Domain issue");
    const external = new ExternalServiceError("Gateway fail", new Error("api"));
    const invalidState = new InvalidStateError("Bad state");
    const insufficient = new InsufficientFundsError("Too broke");

    expect(validation.statusCode).toBe(400);
    expect(notFound.statusCode).toBe(404);
    expect(conflict.statusCode).toBe(409);
    expect(domain.statusCode).toBe(400);
    expect(external.statusCode).toBe(502);

    expect(invalidState).toBeInstanceOf(DomainError);
    expect(insufficient).toBeInstanceOf(DomainError);
  });
});
