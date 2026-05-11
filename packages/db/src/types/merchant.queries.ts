import { loadQueries } from "../query-loader.js";

export const merchantQueries = loadQueries<MerchantQueries>("merchants.sql");

interface MerchantQueries {
  [key: string]: string;
  countMerchants: string;
  createMerchant: string;
  lockMerchantByShortCode: string;
  creditMerchant: string;
  findMerchantByShortCode: string;
  findMerchantById: string;
  updateMerchantCallbackUrl: string;
}
