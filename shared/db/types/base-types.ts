/* Utility Types */

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

export type UserStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";

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
