import { randomUUID } from "node:crypto";

export function createTransaction(overrides = {}) {
  return {
    checkout_id: randomUUID(),
    external_reference: "ext_ref_456",
    short_code: "174379",
    phone_number: "254712345678",
    amount: 100,
    ...overrides,
  };
}
