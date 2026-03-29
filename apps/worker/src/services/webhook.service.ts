import type { WebhookJob, WebHookJobEvent } from "@app/types";
import { logger, payloadBuilder, getCallbackUrl } from "@app/utils";
import { TransactionRepository } from "@app/db";
import axios from "axios";

const repo = new TransactionRepository();

export class WebhookService {
  async dispatchWebhook(data: WebHookJobEvent) {
    // fetch transaction
    const txResult = (await this.getTransaction(data)).rows[0];

    // Build payload
    const payload = await payloadBuilder(txResult);
    const WEBHOOK_URL = getCallbackUrl(txResult);

    // call-back send to mock server
    try {
      const response = await axios.post(WEBHOOK_URL, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      logger.info(
        { status: response.status, data: response.data },
        "[Webhook Service] Callback sent successfully",
      );
    } catch (err) {
      logger.error({ err }, "[Webhook Service] Failed to send callback");
    }
  }

  async getTransaction(data: WebHookJobEvent) {
    const { checkoutId } = data;
    return await repo.getTransactionByCheckoutId(checkoutId);
  }
}
