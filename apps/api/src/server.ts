import express from "express";
import type { Request, Response } from "express";
import testRouter from "./routes/test.js";
import cors from "cors";
import stkRoute from "./routes/stkpush.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { logger } from "@app/utils";

const app = express();

app.get("/health", (req: Request, res: Response) => res.send("Server healthy"));

// CORS middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept"],
    credentials: true,
  }),
);

// Body parser middleware
app.use(express.json());

// Routes
app.use("/api", testRouter);
app.use("/stkpush", stkRoute);

// Callback mock route
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
