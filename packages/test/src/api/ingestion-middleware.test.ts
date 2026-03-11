import { describe, it, expect, vi } from "vitest";
import { errorHandler } from "apps/api/middleware/errorHandler.js";
import { BaseError } from "@app/utils";

describe("errorHandler middleware", () => {
  const mockRes = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  it("handles BaseError correctly", () => {
    const req: any = {};
    const res = mockRes();
    const next = vi.fn();

    const error = new BaseError("Bad Request", 400, true, "Invalid input");

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Bad Request",
      developerHint: "Invalid input",
    });
  });

  it("handles unknown errors with 500", () => {
    const req: any = {};
    const res = mockRes();
    const next = vi.fn();

    const error = new Error("Something broke");

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal Server Error",
    });
  });
});
