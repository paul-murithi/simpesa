import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "apps/api/server.js";

describe("server", () => {
  it("health endpoint works", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.text).toBe("Server healthy");
  });
});
