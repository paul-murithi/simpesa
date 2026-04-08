/* Utility Types */

import type { ZodError } from "zod";
import type { Request } from "express";

export interface StampedRequest<Body = any> extends Request<any, any, Body> {
  timestamp?: string;
}

export interface AuthenticatedRequest extends Request {
  merchantId: string;
}

export interface AuthRequest extends Request {
  short_code: string;
  passkey: string;
}

export type AuthBody = {
  short_code: string;
  passkey: string;
};

export type QueryFn = (text: string, params?: any[]) => Promise<any>;

export type UUID = string;
export type ISODateString = string;

export type Json = Record<string, unknown>;
export type LoadedQueries<T extends string> = {
  [K in T]: string;
};

/*
  Enums
 */

export const TRANSACTION_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  VOIDED: "VOIDED",
} as const;

export type TransactionStatus =
  (typeof TRANSACTION_STATUS)[keyof typeof TRANSACTION_STATUS];

export const TERMINAL_FAILURE_STATUSES = [
  TRANSACTION_STATUS.FAILED,
  TRANSACTION_STATUS.CANCELLED,
  TRANSACTION_STATUS.VOIDED,
] as const;

export const UserStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  BLOCKED: "BLOCKED",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

/**Validation */
export type ValidationResult =
  | { isValid: true; data: CreateTransactionDTO }
  | { isValid: false; errors: unknown; rawError: ZodError };

export type ProcessTransactionResult =
  | { success: true; checkout_id: string }
  | { success: false; checkout_id: string; reason?: string };

/**Testing */
export const testingConstants = {
  MERCHANT_CODE: "174379",
  VALID_USER: "254712345678",
  VALID_USER_B: "254712345679",
  LOW_BALANCE_USER: "254798765432",
  INVALID_MERCHANT: "999999",
  INVALID_USER: "254700000000",
  BLOCKED_USER: "254789765432",
};

/* 
   Merchants Table
 */

export interface Merchant {
  id: UUID;
  short_code: string;
  pass_key: string;
  callback_url: string;
  balance: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateMerchantDTO {
  short_code: string;
  pass_key: string;
  callback_url: string;
}

export interface UpdateMerchantDTO {
  pass_key?: string;
  callback_url?: string;
  balance?: string;
}

/*
 Users Table
*/

export interface User {
  phone_number: string;
  pin: string;
  balance: string;
  status: UserStatus;
  created_at: Date;
}

export interface CreateUserDTO {
  phone_number: string;
  pin: string;
  balance?: string;
  status?: UserStatus;
}

/* 
   Transactions Table
 */
export interface Transaction {
  request_id: UUID;
  checkout_id: UUID;
  external_reference: string;
  short_code: string; // FK: merchants short_code
  phone_number: string; // FK: users phone_number
  amount: string;
  status: TransactionStatus;
  result_code: number | null;
  metadata: Json | null;
  created_at: Date;
  expires_at: Date;
}

export type TransactionBase = {
  short_code: string;
  phone_number: string;
  amount: number;
  external_reference: string;
};

export type PaymentJobPayload = TransactionBase & {
  transaction_id: string;
  checkout_id: string;
  merchant_request_id: string;
};

export interface UpdateTransactionStatusDTO {
  status: TransactionStatus;
  result_code?: number;
}

export type CreateTransactionRequestDTO = TransactionBase & {
  callback_url?: string | undefined;
};

export type CreateTransactionDTO = CreateTransactionRequestDTO & {
  checkout_id: string;
  merchant_request_id: string;
};

/**STK Push */
export type StkPushRequest = TransactionBase;

export type StkPushResponse = {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
};

/**Webhook */
export type BaseCallback = {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
    };
  };
};

export type SuccessCallbackPayload = BaseCallback & {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata: {
        Item: {
          Name: string;
          Value: string | number;
        }[];
      };
    };
  };
};

export type ErrorCallbackPayload = BaseCallback & {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number; // non-zero
      ResultDesc: string;
    };
  };
};

export type CallbackPayload = SuccessCallbackPayload | ErrorCallbackPayload;
export type DispatchStatus = "pending" | "delivered" | "failed" | "delivering";

export type WebhookDispatch = {
  id: string;
  transaction_id: string;
  checkout_id: string;
  callback_url: string;
  payload: CallbackPayload;

  status: DispatchStatus;

  attempt_count: number;
  max_attempts: number;

  next_retry_at: string;
  last_attempt_at: string | null;

  created_at: string;
  updated_at: string;
};

export type WebhookJob = {
  dispatchId: string;
  event: "transaction.completed" | "transaction.failed";
};

export type WebHookJobEvent = {
  checkoutId: string;
  event: "transaction.completed" | "transaction.failed";
};

export const WebhookEvent = {
  TRANSACTION_COMPLETED: "transaction.completed",
  TRANSACTION_FAILED: "transaction.failed",
} as const;

export type WebhookEvent = (typeof WebhookEvent)[keyof typeof WebhookEvent];

export type WebhookResult = {
  success: boolean;
  status?: number;
  body?: any;
  error?: string;
  duration_ms: number;
};

export type WebHookAttempt = {
  dispatch_id: string;
  attempt_number: number;
  response_status?: number | undefined;
  response_body?: string | undefined;
  error_message?: string | undefined;
  duration_ms?: number;
};

export type TransactionResult = {
  checkout_id: string;
  external_reference: string;
  merchant_request_id: string;
  phone_number: string;
  amount: string;
  status: TransactionStatus;
  result_code: number;
  callback_url: string;
};

/**Metadata */
export type ApiMetadataIdentifiers = {
  merchantRequestId: string;
  checkoutRequestId: string;
};
export type ApiRequest = {
  headers: any;
  body: any;
  timestamp: string;
  query?: any;
  ip?: string;
  method?: string;
  url?: string;
};
export type ApiTransactionMetadata = {
  request: ApiRequest;
  identifiers: ApiMetadataIdentifiers;
};

export type TransactionMetadata = {
  request: {
    body: Request;
    headers?: Record<string, string>;
  };

  response?: {
    body: StkPushResponse;
    statusCode?: number;
  };

  callback?: {
    body: Record<string, any>;
    attempts?: number;
    lastAttemptAt?: string;
  };

  simulation?: {
    mode?: "AUTO" | "MANUAL";
    pinEntered?: boolean;
    pinCorrect?: boolean;
  };

  error?: {
    message: string;
    code?: number;
    stack?: string;
  };

  [key: string]: any;
};

export type MetadataPatch = Partial<TransactionMetadata>;
