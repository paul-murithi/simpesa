import { beforeEach, describe, expect, it } from "vitest";
import { createTransaction } from "../factories/transaction.factory.js";
import { StkPushService } from "apps/api/services/stkPush.service.js";
import { pool } from "@app/db";
import { seedMerchant, seedUsers } from "../db/seed-helper.js";
import { ValidationError } from "@app/utils";
import { TransactionUtils } from "apps/api/utils/transaction.utils.js";

describe("API layer validation", () => {
  let service: StkPushService;
  let utils: TransactionUtils;

  beforeEach(async () => {
    await pool.query(
      "TRUNCATE users, merchants, transactions RESTART IDENTITY CASCADE",
    );
    await seedUsers();
    await seedMerchant();
    service = new StkPushService();
    utils = new TransactionUtils();
  });

  describe("Negative or zero transaction amounts", () => {
    it("should reject a transaction involving a negative or zero amount", async () => {
      const transactionA = createTransaction({
        amount: 0,
      });
      const transactionB = createTransaction({
        amount: -100,
      });

      expect(() => service.validateStkRequest(transactionA)).toThrow(
        ValidationError,
      );
      expect(() => service.validateStkRequest(transactionB)).toThrow(
        ValidationError,
      );
    });
  });

  describe("CheckoutId", () => {
    it("should generate a unique checkoutId", () => {
      const checkoutId = utils.generateCheckoutId();
      expect(checkoutId).toBeDefined();
    });
  });
});
