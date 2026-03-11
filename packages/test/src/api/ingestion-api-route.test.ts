import { describe, it, expect } from "vitest";
import stkRoute from "apps/api/routes/stkpush.js";

describe("stkpush routes", () => {
  it("registers POST /v1/processrequest", () => {
    const routes = (stkRoute as any).stack;

    const route = routes.find(
      (r: any) => r.route?.path === "/v1/processrequest",
    );

    expect(route).toBeDefined();
    expect(route.route.methods.post).toBe(true);
  });
});
