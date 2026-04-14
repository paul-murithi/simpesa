import type {
  CallbackPayload,
  WebHookAttempt,
  WebhookDispatch,
  WebhookJob,
  WebHookJobEvent,
  WebhookResult,
} from "@app/types";
import { logger, payloadBuilder, getCallbackUrl } from "@app/utils";
import { TransactionRepository } from "@app/db";
import axios from "axios";

const repo = new TransactionRepository();

export class WebhookService {
  async dispatchWebhook(dispatch: WebhookDispatch): Promise<WebhookResult> {
    const { callback_url, payload } = dispatch;
    const shouldSucceed = true;

    const start = Date.now();

    try {
      const response = await axios.post(
        shouldSucceed ? callback_url : `${callback_url}?fail=true`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const duration = Date.now() - start;

      logger.info(
        { status: response.status },
        "[Webhook Service] Callback sent successfully",
      );

      return {
        success: true,
        status: response.status,
        body: response.data,
        duration_ms: duration,
      };
    } catch (err: any) {
      const duration = Date.now() - start;

      logger.error(
        { err: this.formatAxiosError(err) },
        "[Webhook Service] Failed to send callback",
      );

      return {
        success: false,
        status: err.response?.status,
        body: err.response?.data,
        error: err.message,
        duration_ms: duration,
      };
    }
  }

  formatAxiosError(err: any) {
    return {
      message: err.message,
      status: err.response?.status,
      url: err.config?.url,
      method: err.config?.method,
      response: err.response?.data,
    };
  }

  async getTransaction(data: WebHookJobEvent) {
    const { checkoutId } = data;
    return await repo.getTransactionByCheckoutId(checkoutId);
  }

  async logWebhookAttempt(data: WebHookAttempt, transaction_id?: string) {
    await repo.insertWebHookAttempt(data);
    if (transaction_id) {
      const metadata = JSON.stringify({
        callback: {
          lastAttemptAt: new Date().toISOString(),
          attempts: data.attempt_number,
          lastResponse: {
            status: data.response_status,
            body: data.response_body,
            error: data.error_message,
          },
        },
      });
      await repo.updateTransactionMetadata(transaction_id, metadata);
    }
  }

  async fetchWebhookDispatch(data: WebhookJob) {
    return await repo.fetchWebhookDispatch(data);
  }

  async markWebhookDispatchFailed(dispatchId: string, attemptNumber: number) {
    await repo.markDispatchFailedPermanently(dispatchId, attemptNumber);
  }

  async markDispatchDelivered(dispatchId: string, attemptNumber: number) {
    await repo.markDispatchDelivered(dispatchId, attemptNumber);
  }
}
