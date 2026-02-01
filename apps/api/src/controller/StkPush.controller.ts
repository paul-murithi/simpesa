import type { Request, Response } from "express";
import { StkPushService } from "../service/stkPush.service.js";
import {
  createTransactionSchema,
  type CreateTransactionDTO,
} from "../middleware/transaction.validation.js";
import z from "zod";

export default async function StkPushController(req: Request, res: Response) {
  const result = createTransactionSchema.safeParse(req.body);

  if (!result.success) {
    const formattedErrors = z.treeifyError(result.error);

    return res.status(400).json({
      ResponseCode: "400",
      ResponseDescription: "Invalid request data",
      errors: formattedErrors,
      developerHint:
        "Check your phone_number format and ensure amount is a positive number.",
    });
  }
  // TODO: Next - Redis Fingerprint
  return res.json({ message: "Validation passed!" });
}
