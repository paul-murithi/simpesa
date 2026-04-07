import { Router } from "express";
import { StkPushController } from "../controllers/StkPush.controller.js";
import { timestampMiddleware } from "../middleware/timestamp.middleware.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const stkRoute = Router();

stkRoute.use(timestampMiddleware);
stkRoute.post(
  "/v1/processrequest",
  authMiddleware,
  asyncHandler(StkPushController),
);

export default stkRoute;
