import "dotenv/config";
import app from "./server.js";
import { connectRedis } from "./lib/redisClient.js";
import { logger } from "@app/utils";
import { AuthService } from "./services/auth.service.js";
import { AuthUtils } from "./utils/auth.utils.js";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectRedis();

    const authService = new AuthService();

    // Check first run
    await authService.checkFirstRun();

    // Pregenerate a token for the default merchant
    try {
      const authUtils = new AuthUtils();
      const merchant = await authService.getMerchant("174379");
      if (merchant) {
        const token = authUtils.generateAuthToken(merchant.id);
        await authService.saveTokenToRedis(token, merchant.id);
        logger.info(
          `Pre-generated auth token for merchant 174379: Bearer ${token}`,
        );
      }
    } catch (authError) {
      logger.warn(
        { authError },
        "Failed to pre-generate auth token on startup",
      );
    }

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server:" + error);
    process.exit(1);
  }
}

startServer();
