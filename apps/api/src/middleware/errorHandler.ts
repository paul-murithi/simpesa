import type { Request, Response, NextFunction } from "express";
import { BaseError } from "../utils/errors/Errors.js";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
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
