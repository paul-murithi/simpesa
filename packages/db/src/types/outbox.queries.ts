import { loadQueries } from "../query-loader.js";

export const OutboxQueries = loadQueries<OutboxQueries>("outbox.sql");

interface OutboxQueries {
  [key: string]: string;
  insertIngestionOutboxEvent: string;
  getPendingRecords: string;
}
