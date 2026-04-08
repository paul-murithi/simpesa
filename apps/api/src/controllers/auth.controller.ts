import type { Response, Request } from "express";
import { logger, NotFoundError } from "@app/utils";
import { AuthService } from "../services/auth.service.js";
import type { AuthBody } from "@app/types";

const service = new AuthService();

export async function authController(
  req: Request<{}, {}, AuthBody>,
  res: Response,
) {
  // TODO: Add actual implementation for validation
  const validate = await service.validateAuthRequest(req.body);

  const { passkey, short_code } = req.body;
  const merchant = await service.getMerchant(short_code);
  if (!merchant) {
    throw new NotFoundError(
      "The merchant with the given short code does not existh",
    );
  }

  const passkeyValid = service.passKeyMatches(passkey, merchant);

  // TODO: valid ? Generate token, store in redis, return token : throw error
}
