import { Router } from "express";
import { processRequest, verifyPin, cancelTransaction } from "../controllers/StkPush.controller.js";
import { timestampMiddleware } from "../middleware/timestamp.middleware.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const stkRoute = Router();

stkRoute.use(timestampMiddleware);

// Phase 1: Initiation
stkRoute.post(
  "/v1/processrequest",
  authMiddleware,
  asyncHandler(processRequest),
);

// PIN Resumption
stkRoute.post(
  "/pin/:checkout_id",
  asyncHandler(verifyPin),
);

stkRoute.post(
  "/cancel/:checkout_id",
  asyncHandler(cancelTransaction),
);

export default stkRoute;
