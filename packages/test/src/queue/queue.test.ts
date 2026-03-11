import { describe, it, expect, vi } from "vitest";
import { addPaymentJob, paymentQueue } from "@app/queue";
import { createTransaction } from "../factories/transaction.factory.js";

describe("queue", () => {
  it("adds a payment job", async () => {
    const addMock = vi
      .spyOn(paymentQueue, "add")
      .mockResolvedValue({ id: "job123" } as any);

    const transaction = createTransaction();

    const result = await addPaymentJob(transaction as any);

    expect(addMock).toHaveBeenCalled();
    expect(result).toEqual({ id: "job123" });
  });
});
