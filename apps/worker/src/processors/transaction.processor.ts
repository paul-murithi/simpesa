import { UnrecoverableError, type Job } from "bullmq";
import {
  InsufficientFundsError,
  InvalidStateError,
  NotFoundError,
  logger,
} from "@app/utils";
import type { CreateTransactionDTO } from "@app/types";
import { TransactionService } from "../services/transaction.service.js";

const service = new TransactionService();

export const transactionProcessor = async (
  job: Job<CreateTransactionDTO, void>,
) => {
  const transactionalData = job.data;
  const checkout_id = job.id as string;

  if (!checkout_id) {
    logger.error("Missing checkout_id — cannot process transaction");
    throw new UnrecoverableError(
      "[Processor] Missing checkout_id — cannot process transaction",
    );
  }

  const child = logger.child({ checkoutId: checkout_id });
  child.info("Processing transaction job");

  try {
    await service.processTransaction(transactionalData);
  } catch (error) {
    // 👇 business logic errors → NEVER retry
    if (
      error instanceof InsufficientFundsError ||
      error instanceof NotFoundError ||
      error instanceof InvalidStateError
    ) {
      child.error({ error }, "Business error — no retry");
      throw new UnrecoverableError((error as Error).message);
    }

    // 👇 unknown/transient → let BullMQ retry
    child.error({ error }, "Transient error — will retry");
    throw error;
  }

  child.info("Transaction processed successfully");
};
