import { randomUUID } from "node:crypto";
import { NotFoundError } from "@app/utils";

/**
 * Utility class for authentication-related operations.
 */
export class AuthUtils {
  /**
   * Generates a base64-encoded UUID as an authentication token.
   *
   * @throws {NotFoundError} If the merchantId is missing.
   */
  generateAuthToken(merchantId: string) {
    const encodedToken = Buffer.from(randomUUID()).toString("base64");

    if (!merchantId) {
      throw new NotFoundError("Invalid Merchant ID");
    }
    return encodedToken;
  }

  /**
   * Constructs the Redis keys for token-to-merchant and merchant-to-token mappings.
   */
  getAuthKeys(token: string, merchantId: string): [string, string] {
    return [`auth:token:${token}`, `auth:merchant:${merchantId}`];
  }
}
