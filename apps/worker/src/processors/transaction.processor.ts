import { UnrecoverableError, type Job } from "bullmq";
import {
  InsufficientFundsError,
  InvalidStateError,
  NotFoundError,
  logger,
} from "@app/utils";
import type { CreateTransactionDTO } from "@app/types";
import { TransactionService } from "../services/transaction.service.js";
import { addWebhookJob } from "@app/queue";

const service = new TransactionService();

export const transactionProcessor = async (
  job: Job<CreateTransactionDTO, void>,
) => {
  const transactionalData = job.data;
  const checkout_id = transactionalData.checkout_id;

  if (!checkout_id) {
    logger.error("Missing checkout_id — cannot process transaction");
    throw new UnrecoverableError(
      "[Processor] Missing checkout_id — cannot process transaction",
    );
  }

  const child = logger.child({ checkoutId: checkout_id });
  child.info("Processing transaction job");

  try {
    const result = await service.processTransaction(transactionalData);
    if (result.success) {
      await addWebhookJob({
        checkoutId: checkout_id,
        event: "transaction.completed",
      });
    } else {
      await addWebhookJob({
        checkoutId: checkout_id,
        event: "transaction.failed",
      });
    }

    child.info("Transaction processed successfully");
  } catch (error) {
    if (
      error instanceof InsufficientFundsError ||
      error instanceof NotFoundError ||
      error instanceof InvalidStateError
    ) {
      child.error({ error }, "Business error — no retry");
      throw new UnrecoverableError((error as Error).message);
    }

    child.error({ error }, "Transient error — will retry");
    throw error;
  }
};
