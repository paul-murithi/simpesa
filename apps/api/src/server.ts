import express from "express";
import type { Request, Response } from "express";
import testRouter from "./routes/test.js";
import cors from "cors";
import stkRoute from "./routes/stkpush.js";
import { errorHandler } from "./middleware/errorHandler.js";

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

// Error handling middleware
app.use(errorHandler);

export default app;
