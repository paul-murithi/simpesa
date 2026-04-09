import { randomUUID } from "node:crypto";
import { NotFoundError } from "@app/utils";

export class AuthUtils {
  generateAuthToken(merchantId: string) {
    const encodedToken = Buffer.from(randomUUID()).toString("base64");

    if (!merchantId) {
      throw new NotFoundError("Invalid Merchant ID");
    }
    return encodedToken;
  }

  getAuthKeys(token: string, merchantId: string): [string, string] {
    return [`auth:token:${token}`, `auth:merchant:${merchantId}`];
  }
}
