import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTransaction } from "../factories/transaction.factory.js";
import { StkPushService } from "apps/api/services/stkPush.service.js";
import { pool } from "@app/db";
import { seedMerchant, seedUsers } from "../db/seed-helper.js";
import { ValidationError } from "@app/utils";
import { TransactionUtils } from "apps/api/utils/transaction.utils.js";
import { testingConstants } from "@app/types";
import crypto, { randomUUID } from "crypto";

describe("API layer validation", () => {
  let service: StkPushService;
  let utils: TransactionUtils;

  // Mock redisClient
  const redisClient = {
    set: vi.fn(),
  };

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
  describe("Redis Fingerprint", () => {
    it("should generate a consistent fingerprint for the same transaction data", () => {
      const transaction = createTransaction();
      const fingerprint1 = utils.generateRedisFingerprint(transaction);
      const fingerprint2 = utils.generateRedisFingerprint(transaction);
      expect(fingerprint1).toBe(fingerprint2);
    });

    it("should generate different fingerprints for different transaction data", () => {
      const transactionA = createTransaction({
        phone_number: testingConstants.VALID_USER_B,
        amount: 100,
      });
      const transactionB = createTransaction({
        phone_number: testingConstants.VALID_USER,
        amount: 100,
      });
      const fingerprintA = utils.generateRedisFingerprint(transactionA);
      const fingerprintB = utils.generateRedisFingerprint(transactionB);
      expect(fingerprintA).not.toBe(fingerprintB);
    });

    it("should generate a deterministic SHA256 fingerprint", () => {
      const transaction = createTransaction();
      const { phone_number, short_code, amount, external_reference } =
        transaction;
      const normalizedAmount = Number(amount).toFixed(2);

      const expectedString = `${phone_number}-${short_code}-${normalizedAmount}-${external_reference}`;
      const expectedHash = crypto
        .createHash("sha256")
        .update(expectedString)
        .digest("hex");

      const hash = utils.generateRedisFingerprint(transaction);
      expect(hash).toBe(expectedHash);
    });

    it("should handle amount as string and normalize to 2 decimals", () => {
      const transaction = createTransaction({
        amount: "100",
      });
      const { phone_number, short_code, external_reference } = transaction;

      const expectedString = `${phone_number}-${short_code}-100.00-${external_reference}`;
      const expectedHash = crypto
        .createHash("sha256")
        .update(expectedString)
        .digest("hex");

      expect(utils.generateRedisFingerprint(transaction)).toBe(expectedHash);
    });

    it("should round amount with more than 2 decimals", () => {
      const transaction = createTransaction({
        amount: 100.1234,
      });
      const { phone_number, short_code, external_reference } = transaction;

      const expectedString = `${phone_number}-${short_code}-100.12-${external_reference}`;
      const expectedHash = crypto
        .createHash("sha256")
        .update(expectedString)
        .digest("hex");

      expect(utils.generateRedisFingerprint(transaction)).toBe(expectedHash);
    });

    it("should handle missing external_reference gracefully", () => {
      const transaction = createTransaction({
        external_reference: "",
      });
      const { phone_number, short_code, amount } = transaction;
      const normalizedAmount = Number(amount).toFixed(2);

      const expectedString = `${phone_number}-${short_code}-${normalizedAmount}-`;
      const expectedHash = crypto
        .createHash("sha256")
        .update(expectedString)
        .digest("hex");

      expect(utils.generateRedisFingerprint(transaction)).toBe(expectedHash);
    });

    it("should handle zero amount correctly", () => {
      const transaction = createTransaction({
        amount: 0,
      });
      const { phone_number, short_code, amount, external_reference } =
        transaction;
      const normalizedAmount = Number(amount).toFixed(2);

      const expectedString = `${phone_number}-${short_code}-${normalizedAmount}-${external_reference}`;
      const expectedHash = crypto
        .createHash("sha256")
        .update(expectedString)
        .digest("hex");

      expect(utils.generateRedisFingerprint(transaction)).toBe(expectedHash);
    });
  });
});
