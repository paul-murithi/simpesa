import { logger, UnauthorizedError } from "@app/utils";
import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";
import type { AuthenticatedRequest } from "@app/types";

const service = new AuthService();

/**
 * Middleware that authenticates requests using a Bearer token.
 * Validates the token against Redis and attaches the merchantId to the request object.
 *
 * @async
 * @throws {UnauthorizedError} If the token is missing, invalid, or expired.
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authorizationHeader = req.header("Authorization");
    const token = service.getTokenFromHeader(authorizationHeader);

    const merchantId = token && (await service.getMerchantFromToken(token));

    if (!merchantId) {
      logger.error("[Auth middleware] Invalid/Expired token");
      throw new UnauthorizedError("User unauthorized");
    }

    (req as AuthenticatedRequest).merchantId = merchantId;

    return next();
  } catch (err) {
    return next(err);
  }
};
