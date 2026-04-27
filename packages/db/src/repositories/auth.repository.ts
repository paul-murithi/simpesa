import { Query } from "../client.js";
import { merchantQueries } from "../types/merchant.queries.js";
import { userQueries } from "../types/user.queries.js";

export class AuthRepository {
  async findMerchantByShortCode(short_code: string) {
    return Query(merchantQueries.findMerchantByShortCode, [short_code]);
  }

  async countMerchants(): Promise<number> {
    const result = await Query(merchantQueries.countMerchants);
    return result.rows[0].count;
  }

  async createMerchant(data: {
    short_code: string;
    pass_key: string;
    callback_url: string;
    balance: number;
  }) {
    return Query(merchantQueries.createMerchant, [
      data.short_code,
      data.pass_key,
      data.callback_url,
      data.balance,
    ]);
  }

  async createUser(data: {
    phone_number: string;
    pin: string;
    balance: number;
    status: string;
  }) {
    return Query(userQueries.createUser, [
      data.phone_number,
      data.pin,
      data.balance,
      data.status,
    ]);
  }
}

