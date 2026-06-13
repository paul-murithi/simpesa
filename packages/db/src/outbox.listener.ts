import { logger } from "@app/utils";
import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});

await client.connect();

await client.query("LISTEN outbox_work");

logger.info("Listening on outbox work");

client.on("notification", async () => {
  // TODO: Handle notification
});

// TODO: Handle errors and retries
