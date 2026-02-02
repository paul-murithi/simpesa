import "dotenv/config";
import app from "./index.js";
import { connectRedis } from "./lib/redis/redisClient.js";
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
