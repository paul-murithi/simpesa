import "dotenv/config";
import app from "./server.js";
import { connectRedis } from "./lib/redisClient.js";
import { logger } from "@app/utils";
import { runMigrations } from "@app/db";
import { AuthService } from "./services/auth.service.js";
import { AuthUtils } from "./utils/auth.utils.js";

const PORT = process.env.PORT || 3000;

/**
 * Initializes and starts the API server.
 * Connects to Redis, runs database migrations, checks for first-run status,
 * pre-generates an auth token for the default test merchant, and starts the Express app.
 *
 * @async
 */
async function startServer() {
  try {
    await connectRedis();

    await runMigrations({ seedOnFreshDatabase: false });

    const authService = new AuthService();

    // Check first run
    const isFirstRun = await authService.checkFirstRun();

    // Pregenerate a token for the default merchant if not first run
    if (!isFirstRun) {
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
    }

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error: any) {
    if (error instanceof AggregateError) {
      logger.error(
        { errors: error.errors },
        "Failed to start server: AggregateError",
      );
    } else {
      logger.error(error, "Failed to start server");
    }
    process.exit(1);
  }
}

startServer();
