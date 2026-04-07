import { randomBytes } from "node:crypto";

export function generatePassWord(
  short_code: string,
  passkey: string,
  timestamp: string,
) {
  const text = `${short_code}:${passkey}:${timestamp}`;
  return Buffer.from(text).toString("base64");
}

export function decodePasswordParts(base64Password: string) {
  const decodedText = Buffer.from(base64Password, "base64").toString("utf8");

  const [short_code, passkey, timestamp] = decodedText.split(":");

  return { short_code, passkey, timestamp };
}

export function generateTimeStamp() {
  return new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
}

export function generateMerchantPassKey() {
  return randomBytes(32).toString("hex");
}
