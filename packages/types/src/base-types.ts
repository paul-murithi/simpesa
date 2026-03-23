/* Utility Types */

import type { ZodError } from "zod";

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

export interface UpdateTransactionStatusDTO {
  status: TransactionStatus;
  result_code?: number;
}

export type CreateTransactionRequestDTO = {
  short_code: string;
  phone_number: string;
  amount: number;
  external_reference: string;
  callback_url?: string | undefined;
};

export type CreateTransactionDTO = CreateTransactionRequestDTO & {
  checkout_id: string;
};

/**STK Push */
export type StkPushRequest = {
  short_code: string;
  phone_number: string;
  amount: number;
  external_reference: string;
};

export type StkPushResponse = {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
};

/**Webhook */
export type WebHookPayLoad = {
  event: "TRANSACTION_SUCCESS" | "TRANSACTION_FAILED";
  checkout_id: string;
  amount: number;
  external_reference: string;
  status: "SUCCESS" | "FAILED";
  timestamp: string;
};

/**Metadata */
export type TransactionMetadata = {
  request: {
    body: StkPushRequest;
    headers?: Record<string, string>;
    timestamp: string;
  };

  response?: {
    body: StkPushResponse;
    statusCode?: number;
    timestamp: string;
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
