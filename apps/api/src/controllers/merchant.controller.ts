import type { Response } from "express";
import { AuthService } from "../services/auth.service.js";
import type { AuthenticatedRequest } from "@app/types";

const service = new AuthService();

/**
 * Retrieves the currently authenticated merchant's details.
 *
 * @async
 */
export async function getMerchantController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const merchant = await service.getMerchantById(req.merchantId);
  return res.status(200).json(merchant);
}

/**
 * Updates the currently authenticated merchant's callback URL.
 *
 * @async
 */
export async function updateMerchantController(
  req: AuthenticatedRequest & { body: { callbackUrl: string } },
  res: Response,
) {
  const { callbackUrl } = req.body;
  const merchant = await service.getMerchantById(req.merchantId);
  
  const updatedMerchant = await service.updateMerchantCallbackUrl(
    merchant.short_code,
    callbackUrl,
  );

  return res.status(200).json(updatedMerchant);
}
