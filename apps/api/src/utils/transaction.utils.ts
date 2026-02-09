import crypto, { Hash, randomUUID } from "node:crypto";
import type { CreateTransactionDTO } from "../middleware/transaction.validation.js";

export class TransactionUtils {
  /**
   * Generate a unique Redis fingerprint for a transaction
   * @param param CreateTransactionDTO
   * @returns string
   */
  generateRedisFingerprint(param: CreateTransactionDTO) {
    const { phone_number, short_code, amount, external_reference } = param;
    const normalizeAmount = Number(amount).toFixed(2);
    const dataString = `${phone_number}-${short_code}-${normalizeAmount}-${external_reference}`;

    const hash = crypto.createHash("sha256").update(dataString).digest("hex");

    return hash;
  }
  generateCheckoutId(): string {
    return randomUUID();
  }
}
