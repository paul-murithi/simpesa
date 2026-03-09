export function merchantFactory(overrides = {}) {
  return {
    id: "mrc_123",
    name: "Test Merchant",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}
