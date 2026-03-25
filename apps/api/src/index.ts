import "dotenv/config";
import app from "./server.js";
import { connectRedis } from "./lib/redisClient.js";
import { logger } from "@app/utils";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectRedis();

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error();
    logger.error("Failed to start server:" + error);
    process.exit(1);
  }
}

startServer();
