// apps/api/src/middleware/timestamp.middleware.ts
import type { StampedRequest } from "@app/types";
import type { RequestHandler } from "express";

export const timestampMiddleware: RequestHandler = (req, _res, next) => {
  (req as StampedRequest).timestamp = new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14);
  next();
};
