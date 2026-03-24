const RESULT_DESCRIPTIONS: Record<number, string> = {
  0: "The service request is processed successfully.",
  1: "Insufficient Funds",
  2: "Less Than Minimum Transaction Value",
  3: "More Than Maximum Transaction Value",
  4: "Would Exceed Daily Transfer Limit",
  5: "Would Exceed Minimum Balance",
  6: "Unresolved Primary Party",
  7: "Unresolved Receiver Party",
  8: "Would Exceed Maxiumum Balance",
  11: "Debit Account Invalid",
  12: "Credit Account Invalid",
  13: "Unresolved Debit Account",
  14: "Unresolved Credit Account",
  15: "Duplicate Detected",
  17: "Internal Failure",
  20: "Unresolved Initiator",
  26: "Traffic blocking condition in place",
  1001: "Unable to Lock Subscriber",
  1019: "Transaction expired in the queue",
  1032: "Request cancelled by user",
  1037: "DS Timeout",
  9999: "Request processing failed. Please try again later.",
};

export const RESULT_CODES = {
  SUCCESS: 0,
  INSUFFICIENT_FUNDS: 1,
  LESS_THAN_MIN: 2,
  EXCEEDS_MAX: 3,
  EXCEEDS_DAILY_LIMIT: 4,
  EXCEEDS_MIN_BALANCE: 5,
  UNRESOLVED_PRIMARY_PARTY: 6,
  UNRESOLVED_RECEIVER: 7,
  EXCEEDS_MAX_BALANCE: 8,
  DEBIT_ACCOUNT_INVALID: 11,
  CREDIT_ACCOUNT_INVALID: 12,
  UNRESOLVED_DEBIT: 13,
  UNRESOLVED_CREDIT: 14,
  DUPLICATE_DETECTED: 15,
  INTERNAL_FAILURE: 17,
  UNRESOLVED_INITIATOR: 20,
  TRAFFIC_BLOCKING: 26,
  SUBSCRIBER_LOCKED: 1001,
  TRANSACTION_EXPIRED: 1019,
  CANCELLED_BY_USER: 1032,
  DS_TIMEOUT: 1037,
  GENERAL_ERROR: 9999,
} as const;

export type ResultCode = (typeof RESULT_CODES)[keyof typeof RESULT_CODES];

export function getResultDesc(resultCode: number): string {
  return (
    RESULT_DESCRIPTIONS[resultCode] ?? `Unknown result code: ${resultCode}`
  );
}
