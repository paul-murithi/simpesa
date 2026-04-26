import type { Request, Response, NextFunction, RequestHandler } from "express";
import { BaseError, NotFoundError, UnauthorizedError } from "@app/utils";

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

export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
