import type { WebhookJob } from "@app/types";
import { logger, payloadBuilder } from "@app/utils";
import { Query, TransactionRepository } from "@app/db";

const repo = new TransactionRepository();

export class WebhookService {
  async dispatchWebhook(data: WebhookJob) {
    const txResult = (await this.getTransaction(data)).rows[0];
    logger.info({ txResult }, "[Webhook Service] Transaction result");

    const payload = payloadBuilder(txResult);

    // TODO: Proceed to send WebHook
  }

  async getTransaction(data: WebhookJob) {
    const { checkoutId } = data;
    return await repo.getTransactionByCheckoutId(checkoutId);
  }
}
