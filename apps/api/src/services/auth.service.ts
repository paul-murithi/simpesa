import {
  ExternalServiceError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@app/utils";
import { redisClient } from "../lib/redisClient.js";
import { AuthRepository } from "@app/db";
import type { AuthBody, Merchant } from "@app/types";
import { AuthUtils } from "../utils/auth.utils.js";

const repo = new AuthRepository();
const utils = new AuthUtils();

/**
 * Service for handling merchant authentication, registration, and token management.
 */
export class AuthService {
  private static isFirstRun = true;

  /**
   * Sets the global first-run status of the appliance.
   *
   * @static
   */
  static async setFirstRunStatus(status: boolean) {
    this.isFirstRun = status;
  }

  /**
   * Gets the current global first-run status.
   *
   * @static
   */
  static getFirstRunStatus() {
    return this.isFirstRun;
  }

  /**
   * Checks the database to determine if this is the first time the appliance is running.
   * Updates the global status accordingly.
   *
   * @async
   */
  async checkFirstRun(): Promise<boolean> {
    const count = await repo.countMerchants();
    AuthService.setFirstRunStatus(count === 0);
    return AuthService.getFirstRunStatus();
  }

  /**
   * Registers a new merchant and seeds a default test user.
   *
   * @async
   * @throws {ValidationError} If the callback URL format is invalid.
   */
  async registerMerchant(data: { shortCode: string; callbackUrl: string }) {
    const passKey =
      "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";

    try {
      await repo.createMerchant({
        short_code: data.shortCode,
        pass_key: passKey,
        callback_url: data.callbackUrl,
        balance: 1000000,
      });
    } catch (error: any) {
      // Postgres check constraint violation
      if (error.code === "23514") {
        throw new ValidationError(
          "Invalid Callback URL. Ensure it starts with http:// or https:// and is a valid format.",
          "Check the CHECK constraint in the merchants table.",
        );
      }
      throw error;
    }

    try {
      await repo.createUser({
        phone_number: "254700000000",
        pin: "1234",
        balance: 10000.0,
        status: "ACTIVE",
      });
    } catch (userError: any) {
      // Ignore if user already exists
      if (userError.code !== "23505") {
        throw userError;
      }
    }

    AuthService.setFirstRunStatus(false);
  }

  /**
   * Retrieves a merchant ID from Redis using an authentication token.
   *
   * @async
   */
  async getMerchantFromToken(token: string) {
    if (!token) return null;
    return await redisClient.get(`auth:token:${token.trim()}`);
  }

  /**
   * Extracts the Bearer token from the 'Authorization' header.
   *
   * @param {string|undefined} header - The raw 'Authorization' header value.
   * @throws {UnauthorizedError} If the header is missing or the format is invalid.
   */
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

  /**
   * Retrieves a merchant's details from the database using their short code.
   *
   * @async
   * @throws {NotFoundError} If the merchant is not found.
   */
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

  /**
   * Validates an authentication request body.
   * (Placeholder for future implementation)
   *
   * @async
   */
  async validateAuthRequest(data: AuthBody) {
    return {};
  }

  /**
   * Checks if the provided passkey matches the merchant's stored passkey.
   *
   * @async
   */
  async passKeyMatches(passkey: string, merchant: Merchant): Promise<boolean> {
    const { pass_key: dbPasskey } = merchant;

    if (!dbPasskey) return false;

    return passkey === dbPasskey;
  }

  /**
   * Retrieves an existing token for a merchant from Redis.
   *
   * @async
   */
  async getMerchantToken(merchantId: string): Promise<string | null> {
    return await redisClient.get(`auth:merchant:${merchantId}`);
  }

  /**
   * Saves an authentication token to Redis with a TTL of 1 hour.
   * Uses a Lua script to ensure atomicity and handle old token cleanup.
   *
   * @async
   * @throws {ExternalServiceError} If the Redis operation fails.
   */
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
      arguments: [token, merchantId, "3600"],
    });

    if (!Array.isArray(result) || !result.every((r) => r === "OK")) {
      throw new ExternalServiceError("Failed to persist auth token in Redis");
    }
    return true;
  }
}
