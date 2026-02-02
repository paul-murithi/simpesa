import type { Request, Response } from "express";
import { StkPushService } from "../service/stkPush.service.js";
import {
  createTransactionSchema,
  type CreateTransactionDTO,
} from "../middleware/transaction.validation.js";
import z from "zod";
import { AppError } from "../utils/errors/AppError.js";

export default async function StkPushController(req: Request, res: Response) {
  const result = createTransactionSchema.safeParse(req.body);
  const service = new StkPushService();

  if (!result.success) {
    const formattedErrors = z.treeifyError(result.error).errors;

    throw new AppError(
      400,
      "Invalid request data",
      "Check your phone_number format and ensure amount is a positive number.",
    );
  }

  const data: CreateTransactionDTO = result.data;

  // Generate Redis Fingerprint and attempt to lock
  const lock = await service.tryLockTransaction(data);

  if (!lock) {
    throw new AppError(
      429,
      "Too Many Requests",
      "Duplicate transaction detected. Please wait 60 seconds before retrying the same payload.",
    );
  }

  try {
    // TODO: Atomic Persistence to Postgres
  } catch (error) {
    // Clean up Redis key on DB failure
    if (lock) {
      await service.releaseLock(lock.key, lock.token);
    }
    throw new AppError(
      500,
      "Internal Server Error",
      "An error occurred while processing your transaction.",
    );
  }

  return res.json({ message: "Validation passed!" });
}
