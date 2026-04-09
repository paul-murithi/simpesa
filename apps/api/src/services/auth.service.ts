import {
  ExternalServiceError,
  NotFoundError,
  UnauthorizedError,
} from "@app/utils";
import { redisClient } from "../lib/redisClient.js";
import { AuthRepository } from "@app/db";
import type { AuthBody, Merchant } from "@app/types";
import { AuthUtils } from "../utils/auth.utils.js";

const repo = new AuthRepository();
const utils = new AuthUtils();

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

  async passKeyMatches(passkey: string, merchant: Merchant): Promise<boolean> {
    const { pass_key: dbPasskey } = merchant;

    if (!dbPasskey) return false;

    return passkey === dbPasskey;
  }

  async saveTokenToRedis(token: string, merchantId: string) {
    const script = `
    local ttl = ARGV[3]

    -- check if merchant already has a token
    local oldToken = redis.call('GET', KEYS[2])

    if oldToken then
      redis.call('DEL', 'auth:token:' .. oldToken)
    end

    -- set new structure
    local r1 = redis.call('SET', KEYS[1], ARGV[2], 'EX', ttl)
    local r2 = redis.call('SET', KEYS[2], ARGV[1], 'EX', ttl)

    return {r1, r2}
  `;

    const [tokenKey, merchantKey] = utils.getAuthKeys(token, merchantId);

    const result = await redisClient.eval(script, {
      keys: [tokenKey, merchantKey],
      arguments: [
        token,
        merchantId,
        "80", // TODO: 80 for testing
      ],
    });

    if (!Array.isArray(result) || !result.every((r) => r === "OK")) {
      throw new ExternalServiceError("Failed to persist auth token in Redis");
    }
    return true;
  }
}
