import { describe, it, expect, beforeEach } from "vitest";

import { pool, TransactionRepository } from "@app/db";
import {
  ConflictError,
  InsufficientFundsError,
  NotFoundError,
} from "@app/utils";
import { TransactionService } from "../../../../apps/worker/src/services/transaction.service.js";
import { TRANSACTION_STATUS } from "@app/types";
import { createTransaction } from "../factories/transaction.factory.js";
import { seedMerchant, seedUsers } from "../db/seed-helper.js";

describe("TransactionService - Pre-validation", () => {
  let repo: TransactionRepository;
  let service: TransactionService;

  const MERCHANT_CODE = "174379";
  const VALID_USER = "254712345678";
  const LOW_BALANCE_USER = "254798765432";
  const INVALID_MERCHANT = "999999";
  const INVALID_USER = "254700000000";
  const BLOCKED_USER = "254789765432";

  beforeEach(async () => {
    await pool.query(
      "TRUNCATE users, merchants, transactions RESTART IDENTITY CASCADE",
    );
    await seedUsers();
    await seedMerchant();

    repo = new TransactionRepository();
    service = new TransactionService();
  });

  describe("userAndMerchantExists", () => {
    it("should throw NotFoundError when user does not exist", async () => {
      await expect(
        service.userAndMerchantExist(MERCHANT_CODE, INVALID_USER),
      ).rejects.toThrow(NotFoundError);
    });
    it("should throw NotFoundError when merchant does not exist", async () => {
      await expect(
        service.userAndMerchantExist(INVALID_MERCHANT, VALID_USER),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("insufficientFunds", () => {
    it("should throw InsufficientFundsError when user balance is too low", async () => {
      const transaction = createTransaction({
        phone_number: LOW_BALANCE_USER,
        amount: 100,
      });

      await expect(repo.lockRowsValidate(transaction)).rejects.toThrow(
        InsufficientFundsError,
      );
    });

    it("should change status to FAILED of a transaction with insufficient funds", async () => {
      const transaction = createTransaction({
        phone_number: LOW_BALANCE_USER,
        amount: 100,
      });
      await expect(repo.lockRowsValidate(transaction)).rejects.toThrow(
        InsufficientFundsError,
      );
      // Verify Transaction was created but status FAILED
      const result = await pool.query(
        'SELECT "status" FROM transactions WHERE checkout_id = $1',
        [transaction.checkout_id],
      );
      expect(result.rows[0].status).toBe(TRANSACTION_STATUS.FAILED);
    });
  });

  describe("Idempotency", () => {
    it("should skip a transaction whose checkout_id already exists", async () => {
      const transaction = createTransaction();
      // First transaction succeeds
      await repo.lockRowsValidate(transaction);

      // Second should fail
      await repo.lockRowsValidate(transaction);

      const { rows } = await pool.query(
        "SELECT COUNT(*) FROM transactions WHERE checkout_id = $1",
        [transaction.checkout_id],
      );
      expect(Number(rows[0].count)).toBe(1);
    });
  });

  describe("Valid Transaction", () => {
    it("should change a valid transaction to PROCESSING", async () => {
      const transaction = createTransaction();

      await repo.lockRowsValidate(transaction);

      const { rows } = await pool.query(
        `SELECT "status" FROM transactions WHERE checkout_id = $1`,
        [transaction.checkout_id],
      );

      expect(rows[0].status).toBe(TRANSACTION_STATUS.PROCESSING);
    });
    it("should keep user balance untouched", async () => {
      const transaction = createTransaction();
      const balanceBefore = (
        await pool.query("SELECT balance FROM users WHERE phone_number = $1", [
          transaction.phone_number,
        ])
      ).rows[0].balance;

      await repo.lockRowsValidate(transaction);

      const { rows } = await pool.query(
        "SELECT balance FROM users WHERE phone_number = $1",
        [transaction.phone_number],
      );
      const balanceAfter = rows[0].balance;

      expect(balanceBefore).toBe(balanceAfter);
    });
  });

  describe("User blocked / inactive", () => {
    it("should prevent a transaction request involving a blocked user", async () => {
      const transaction = createTransaction({
        phone_number: BLOCKED_USER,
      });

      await expect(
        service.userAndMerchantExist(
          transaction.short_code,
          transaction.phone_number,
        ),
      ).rejects.toThrow(ConflictError);
    });
  });
});
