export function userFactory(overrides = {}) {
  return {
    id: "usr_123",
    name: "John Doe",
    email: "john.doe@example.com",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}
