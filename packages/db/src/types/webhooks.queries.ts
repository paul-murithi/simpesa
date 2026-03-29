import { loadQueries } from "../query-loader.js";

export const webhookQueries = loadQueries<WebhookQueries>("webhooks.sql");

interface WebhookQueries {
  [key: string]: string;
  createWebhookDispatch: string;
}
