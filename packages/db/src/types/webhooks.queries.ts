import { loadQueries } from "../query-loader.js";

export const webhookQueries = loadQueries<WebhookQueries>("webhooks.sql");

interface WebhookQueries {
  [key: string]: string;
  createWebhookDispatch: string;
  fetchDispatch: string;
  logWebhookAttempt: string;
  markWebhookDispatchDelivered: string;
  markWebhookDispatchFailed: string;
  getWebhookAttemptsByDispatch: string;
  getPendingWebhookDispatches: string;
}
