import crypto, { randomUUID } from "node:crypto";
import type { CreateTransactionRequestDTO } from "@app/types";

export class TransactionUtils {
  /**
   * Generate a unique Redis fingerprint for a transaction
   * @param param = CreateTransactionRequestDTO
   * @returns string
   */
  generateRedisFingerprint(param: CreateTransactionRequestDTO) {
    const { phone_number, short_code, amount, external_reference } = param;
    const normalizeAmount = Number(amount).toFixed(2);
    const dataString = `${phone_number}-${short_code}-${normalizeAmount}-${external_reference}`;

    const hash = crypto.createHash("sha256").update(dataString).digest("hex");

    return hash;
  }
  generateCheckoutId(): string {
    return randomUUID();
  }
  generateMerchantRequestId(): string {
    return randomUUID();
  }
}
