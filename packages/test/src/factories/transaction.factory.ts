export function transactionFactory(overrides = {}) {
  return {
    id: "txn_123",
    amount: 1000,
    currency: "USD",
    status: "pending",
    merchant_id: "mrc_123",
    user_id: "usr_123",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}
