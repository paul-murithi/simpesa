import { logger, UnauthorizedError } from "@app/utils";
import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";
import type { AuthenticatedRequest } from "@app/types";

const service = new AuthService();

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
