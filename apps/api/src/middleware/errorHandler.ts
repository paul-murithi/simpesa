import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors/AppError.js";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      ResponseCode: err.responseCode,
      ResponseDescription: err.message,
      developerHint: err.developerHint,
    });
  }

  console.error(err);

  return res.status(500).json({
    ResponseCode: "500",
    ResponseDescription: "Internal Server Error",
    developerHint: "An unexpected error occurred.",
  });
}
