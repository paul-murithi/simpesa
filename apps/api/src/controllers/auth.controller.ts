import type { Response, Request } from "express";
import { logger, NotFoundError, UnauthorizedError } from "@app/utils";
import { AuthService } from "../services/auth.service.js";
import type { AuthBody } from "@app/types";
import { AuthUtils } from "../utils/auth.utils.js";

const service = new AuthService();
const utils = new AuthUtils();

/**
 * Handles merchant authentication and token generation.
 * Validates the merchant's short code and passkey, then returns an existing
 * or newly generated authentication token.
 *
 * @async
 * @throws {NotFoundError} If the merchant with the provided short code is not found.
 * @throws {UnauthorizedError} If the provided passkey is incorrect.
 */
export async function authController(
  req: Request<{}, {}, AuthBody>,
  res: Response,
) {
  // TODO: Add actual implementation for validation
  // const validate = await service.validateAuthRequest(req.body);

  const { passkey, short_code } = req.body;
  const merchant = await service.getMerchant(short_code);
  if (!merchant) {
    throw new NotFoundError(
      "The merchant with the given short code does not exist",
    );
  }

  if (!(await service.passKeyMatches(passkey, merchant))) {
    throw new UnauthorizedError("The passkey is invalid/incorrect");
  }

  let token = await service.getMerchantToken(merchant.id);

  if (!token) {
    token = utils.generateAuthToken(merchant.id);
    await service.saveTokenToRedis(token, merchant.id);
  }

  return res.status(200).json({ token: token });
}
