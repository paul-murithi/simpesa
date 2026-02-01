import { TransactionRepository } from "../../../../shared/db/repositories/transaction.repository.js";
import {
  TRANSACTION_STATUS,
  type TransactionStatus,
} from "../../../../shared/db/types/base-types.js";
import { TransactionUtils } from "../utils/transaction.utils.js";

export class StkPushService {
  async processStkPushRequest(data: any) {
    // Core packages
    const repo = new TransactionRepository();
    const utils = new TransactionUtils();

    const fingerprint = await utils.generateRedisFingerprint();
    const checkoutId = await utils.generateCheckoutId();
    const status: TransactionStatus = TRANSACTION_STATUS.PENDING;

    return { success: true };
  }
}
