import type { StampedRequest } from "@app/types";
import type { RequestHandler } from "express";

/**
 * Middleware that attaches a formatted timestamp (YYYYMMDDHHMMSS) to the request object.
 * This matches the format expected by the M-Pesa API.
 */
export const timestampMiddleware: RequestHandler = (req, _res, next) => {
  (req as StampedRequest).timestamp = new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14);
  next();
};
