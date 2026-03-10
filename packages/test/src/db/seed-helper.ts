import { Query } from "@app/db";

export async function seedUsers() {
  await Query(`
    INSERT INTO users (phone_number, pin, balance, status) 
    VALUES 
      ('254712345678', '1234', 1000.00, 'ACTIVE'), -- normal balance
      ('254798765432', '1234', 50.00, 'ACTIVE') -- low balance
  `);
}

export async function seedMerchant() {
  await Query(`
    INSERT INTO merchants (short_code, pass_key, callback_url, balance)
    VALUES ('174379', 'pass_key123', 'http://localhost:3000/callback', 0.00)
  `);
}
