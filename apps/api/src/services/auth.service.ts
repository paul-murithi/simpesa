import { UnauthorizedError } from "@app/utils";
import { redisClient } from "../lib/redisClient.js";

export class AuthService {
  async getMerchantFromToken(token: string) {
    return await redisClient.get(token);
  }

  getTokenFromHeader(header: string | undefined) {
    if (!header) {
      throw new UnauthorizedError("Missing Authorization header");
    }

    const parts = header.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      throw new UnauthorizedError("Invalid Authorization format");
    }

    return parts[1];
  }
}
