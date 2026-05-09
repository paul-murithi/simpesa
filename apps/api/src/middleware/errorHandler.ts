import type { Request, Response, NextFunction, RequestHandler } from "express";
import { BaseError, NotFoundError, UnauthorizedError } from "@app/utils";

/**
 * Global error handling middleware for Express.
 * Catches errors thrown in routes and controllers and returns appropriate JSON responses.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof NotFoundError) {
    return res.status(404).json({ message: err.message });
  }

  if (err instanceof UnauthorizedError) {
    return res.status(401).json({
      message: "User unauthorized",
    });
  }

  if (err instanceof BaseError) {
    return res.status(err.statusCode).json({
      message: err.message,
      developerHint: err.developerHint,
    });
  }

  console.error("Unexpected error:", err);

  return res.status(500).json({
    message: "Internal Server Error",
  });
}

/**
 * A wrapper for asynchronous request handlers to catch errors and pass them to the error handler middleware.
 */
export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
