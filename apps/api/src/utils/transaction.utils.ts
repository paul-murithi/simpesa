import crypto, { randomUUID } from "node:crypto";
import type { CreateTransactionRequestDTO } from "@app/types";

/**
 * Utility class for transaction-related operations, such as ID generation and fingerprinting.
 */
export class TransactionUtils {
  /**
   * Generates a unique SHA-256 fingerprint for a transaction to prevent duplicate submissions.
   */
  generateRedisFingerprint(param: CreateTransactionRequestDTO) {
    const { phone_number, short_code, amount, external_reference } = param;
    const normalizeAmount = Number(amount).toFixed(2);
    const dataString = `${phone_number}-${short_code}-${normalizeAmount}-${external_reference}`;

    const hash = crypto.createHash("sha256").update(dataString).digest("hex");

    return hash;
  }
  /**
   * Generates a unique checkout ID (UUID).
   */
  generateCheckoutId(): string {
    return randomUUID();
  }
  /**
   * Generates a unique merchant request ID (UUID).
   */
  generateMerchantRequestId(): string {
    return randomUUID();
  }
}
