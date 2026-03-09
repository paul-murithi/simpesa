import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TransactionRepository } from "@app/db";
import { pool } from "@app/db";
import { TRANSACTION_STATUS } from "@app/types";
import { randomUUID } from "node:crypto";

describe("TransactionRepository - Phase 1: lockRowsValidate", () => {
  let repo: TransactionRepository;

  beforeEach(async () => {
    repo = new TransactionRepository();

    // Clean before each test
    await pool.query(
      "TRUNCATE transactions, users, merchants RESTART IDENTITY CASCADE",
    );

    // Insert test data
    await pool.query(`
      INSERT INTO users (phone_number, pin, balance, status) 
      VALUES ('254712345678', '1234', 1000.00, 'ACTIVE')
    `);

    await pool.query(`
      INSERT INTO merchants (short_code, pass_key, callback_url, balance)
      VALUES ('174379', 'passkey123', 'http://localhost:3000/callback', 0.00)
    `);
  });

  it("should successfully lock rows and validate when user has sufficient balance", async () => {
    // ARRANGE (Valid transaction)
    const transaction = {
      checkout_id: randomUUID(),
      external_reference: "ext_ref_123",
      short_code: "174379",
      phone_number: "254712345678",
      amount: 500.0,
    };

    // ACT
    await repo.lockRowsValidate(transaction);

    // ASSERT: Check transaction was created with PROCESSING status
    const result = await pool.query(
      "SELECT * FROM transactions WHERE checkout_id = $1",
      [transaction.checkout_id],
    );

    expect(result.rows[0]).toBeDefined();
    expect(result.rows[0].status).toBe(TRANSACTION_STATUS.PROCESSING);
    expect(result.rows[0].amount).toBe("500.00");
  });
});
