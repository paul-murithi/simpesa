import { loadQueries } from "../query-loader.js";

export const merchantQueries = loadQueries<MerchantQueries>("merchants.sql");

interface MerchantQueries {
  [key: string]: string;
  lockMerchantByShortCode: string;
  creditMerchant: string;
}
