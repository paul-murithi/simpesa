import { transactionQueries } from "../types/transaction.queries.js";
import db from "../../db/client.js";

export class TransactionRepository {
  async insertNewTransaction(params: {
    checkoutId: string;
    externalReference: string;
    shortCode: string;
    phoneNumber: string;
    amount: number;
    status: string;
  }) {
    const queryText = transactionQueries.InsertTransaction;
    const values = [
      params.checkoutId,
      params.externalReference,
      params.shortCode,
      params.phoneNumber,
      params.amount,
    ];

    const result = await db.query(queryText, values);
    return result.rows[0];
  }
}
