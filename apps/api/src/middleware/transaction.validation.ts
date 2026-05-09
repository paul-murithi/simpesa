import { z } from "zod";

/**
 * Zod schema for validating STK Push transaction requests.
 * Ensures the presence and correct format of short_code, phone_number,
 * amount, external_reference, and callback_url.
 */
export const createTransactionSchema = z.object({
  short_code: z.string().min(5, "Short code must be at least 5 digits"),
  phone_number: z
    .string()
    .regex(
      /^(254)(7|1)\d{8}$/,
      "Invalid Kenyan phone number (e.g 254712345678)",
    ),
  amount: z.coerce
    .number()
    .positive("Amount must be greater than 0")
    .max(99_999_999.99, "Amount exceeds maximum allowed")
    .refine(
      (val) => Number.isInteger(val * 100),
      "Amount must have at most 2 decimal places",
    ),
  external_reference: z.string().min(1, "Reference is required").max(50),
  callback_url: z
    .url("A valid CallbackURL is required for STK Push")
    .optional(),
});
