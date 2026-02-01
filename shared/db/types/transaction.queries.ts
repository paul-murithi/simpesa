import { loadQueries } from "../query-loader.js";

// Load transaction related SQL queries
export const transactionQueries =
  loadQueries<transactionQueries>("transactions.sql");

interface transactionQueries {
  [key: string]: string;
  InsertTransaction: string;
  GetTransactionById: string;
  UpdateTransactionStatus: string;
}
