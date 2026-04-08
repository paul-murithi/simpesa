import { NotFoundError, UnauthorizedError } from "@app/utils";
import { redisClient } from "../lib/redisClient.js";
import { AuthRepository } from "@app/db";
import type { AuthBody, Merchant } from "@app/types";

const repo = new AuthRepository();

export class AuthService {
  async getMerchantFromToken(token: string) {
    return await redisClient.get(token);
  }

  getTokenFromHeader(header: string | undefined) {
    if (!header) {
      throw new UnauthorizedError("Missing Authorization header");
    }

    const parts = header.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      throw new UnauthorizedError("Invalid Authorization format");
    }

    return parts[1];
  }

  async getMerchant(short_code: string): Promise<Merchant> {
    const merchantResult = await repo.findMerchantByShortCode(short_code);
    if (merchantResult.rowCount === 0) {
      throw new NotFoundError(
        `Merchant with short code ${short_code} not found`,
      );
    }
    const merchant = merchantResult.rows[0];
    return merchant;
  }

  // TODO: Add Zod validation
  async validateAuthRequest(data: AuthBody) {
    return {};
  }

  async passKeyMatches(passkey: string, merchant: Merchant) {
    // TODO: Add actual check
    const { pass_key: DbPasskey } = merchant;
  }
}
