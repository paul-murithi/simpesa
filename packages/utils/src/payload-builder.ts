import {
  TERMINAL_FAILURE_STATUSES,
  TRANSACTION_STATUS,
  type CallbackPayload,
  type ErrorCallbackPayload,
  type SuccessCallbackPayload,
  type TransactionResult,
  type TransactionStatus,
} from "@app/types";
import { getResultDesc } from "./map-result-code.js";
import { logger } from "./logger.js";

export async function payloadBuilder(
  transaction: TransactionResult,
): Promise<CallbackPayload> {
  if (transaction.status === TRANSACTION_STATUS.SUCCESS) {
    return buildSuccessPayload(transaction);
  }

  if (isTerminalFailure(transaction.status)) {
    return buildErrorPayload(transaction);
  }
  const child = logger.child({ checkoutId: transaction.checkout_id });
  child.error(
    `Cannot build callback payload for non-terminal status: ${transaction.status}`,
  );
  throw new Error(
    `Cannot build callback payload for non-terminal status: ${transaction.status}`,
  );
}

function buildSuccessPayload(
  transaction: TransactionResult,
): SuccessCallbackPayload {
  const description = getResultDesc(transaction.result_code);
  return {
    Body: {
      stkCallback: {
        MerchantRequestID: transaction.merchant_request_id,
        CheckoutRequestID: transaction.checkout_id,
        ResultCode: transaction.result_code,
        ResultDesc: description,
        CallbackMetadata: {
          Item: [
            { Name: "Amount", Value: parseFloat(transaction.amount) },
            { Name: "MpesaReceiptNumber", Value: "N/A" },
            // TODO: Add transaction date
            { Name: "PhoneNumber", Value: Number(transaction.phone_number) },
          ],
        },
      },
    },
  };
}

function buildErrorPayload(
  transaction: TransactionResult,
): ErrorCallbackPayload {
  const description = getResultDesc(transaction.result_code);
  return {
    Body: {
      stkCallback: {
        MerchantRequestID: transaction.merchant_request_id,
        CheckoutRequestID: transaction.checkout_id,
        ResultCode: transaction.result_code,
        ResultDesc: description,
      },
    },
  };
}

function isTerminalFailure(status: TransactionStatus): boolean {
  return TERMINAL_FAILURE_STATUSES.includes(status as any);
}

export function getCallbackUrl(transaction: TransactionResult) {
  return transaction.callback_url;
}
