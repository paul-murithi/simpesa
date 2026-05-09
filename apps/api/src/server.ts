import express from "express";
import type { Request, Response } from "express";
import testRouter from "./routes/test.js";
import cors from "cors";
import stkRoute from "./routes/stkpush.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { logger } from "@app/utils";
import authRoute from "./routes/auth.route.js";
import transactionsRoute from "./routes/transactions.route.js";
import statusRoute from "./routes/status.route.js";
import onboardingRoute from "./routes/onboarding.route.js";

const app = express();

const defaultAllowedOrigins = [
  "http://localhost:35173",
  "http://127.0.0.1:35173",
  "http://localhost:34173",
  "http://127.0.0.1:34173",
];

const allowedOrigins = (
  process.env.CORS_ORIGINS?.split(",").map((origin) => origin.trim()) ??
  defaultAllowedOrigins
).filter(Boolean);

app.get("/health", (req: Request, res: Response) => res.send("Server healthy"));

// CORS middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
    credentials: true,
  }),
);

// Body parser middleware
app.use(express.json());

// Routes
// app.use("/api", testRouter);
app.use("/oauth/v1", authRoute);
app.use("/api/transactions", transactionsRoute);
app.use("/api/v1/status", statusRoute);
app.use("/api/v1/onboarding", onboardingRoute);
app.use("/stkpush", stkRoute);

// Callback mock route
/**
 * Mock callback endpoint for testing webhook delivery locally.
 * Logs the received payload and returns a success response.
 * Can be forced to fail by adding '?fail=true' to the URL.
 *
 * @name post/callback
 * @function
 */
app.post("/callback", (req, res) => {
  const shouldFail = req.query.fail === "true";

  if (shouldFail) {
    console.log("[Mock Callback] FORCED FAILURE");
    return res.status(500).send({ status: "forced failure" });
  }

  const payload = req.body;

  if (payload?.Body?.stkCallback?.CallbackMetadata) {
    console.log("[Mock Callback] SUCCESS payload received:");
  } else {
    console.log("[Mock Callback] ERROR payload received:");
  }

  console.log(JSON.stringify(payload, null, 2));

  res.status(200).send({ status: "ok" });
});

app.use(errorHandler);

export default app;
