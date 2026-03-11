import { describe, it, expect, vi, beforeEach } from "vitest";

const listenMock = vi.fn();
const connectRedisMock = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

vi.mock("../../../../apps/api/src/server.js", () => ({
  default: { listen: listenMock },
}));

vi.mock("../../../../apps/api/src/lib/redisClient.js", () => ({
  connectRedis: connectRedisMock,
}));

describe("api server bootstrap", () => {
  it("connects redis and starts server", async () => {
    process.env.PORT = "3001";

    await import("../../../../apps/api/src/index.js");

    expect(connectRedisMock).toHaveBeenCalled();
    expect(listenMock).toHaveBeenCalledWith("3001", expect.any(Function));
  });
});
