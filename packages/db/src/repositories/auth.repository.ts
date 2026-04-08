import { Query } from "../client.js";
import { merchantQueries } from "../types/merchant.queries.js";

export class AuthRepository {
  async findMerchantByShortCode(short_code: string) {
    return Query(merchantQueries.findMerchantByShortCode, [short_code]);
  }
}
