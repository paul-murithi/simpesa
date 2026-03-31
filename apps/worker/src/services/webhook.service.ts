import type {
  CallbackPayload,
  WebhookDispatch,
  WebhookJob,
  WebHookJobEvent,
} from "@app/types";
import { logger, payloadBuilder, getCallbackUrl } from "@app/utils";
import { TransactionRepository } from "@app/db";
import axios from "axios";

const repo = new TransactionRepository();

export class WebhookService {
  async dispatchWebhook(dispatch: WebhookDispatch) {
    const { callback_url, payload } = dispatch;

    // call-back send to mock server
    try {
      const response = await axios.post(callback_url, payload, {
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
      return err;
    }
  }

  async getTransaction(data: WebHookJobEvent) {
    const { checkoutId } = data;
    return await repo.getTransactionByCheckoutId(checkoutId);
  }

  async fetchWebhookDispatch(data: WebhookJob) {
    return await repo.fetchWebhookDispatch(data);
  }
}
