import { Router } from "express";
import { StkPushController } from "../controllers/StkPush.controller.js";
import { timestampMiddleware } from "../middleware/timestamp.middleware.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const stkRoute = Router();

stkRoute.use(timestampMiddleware);
stkRoute.post("/v1/processrequest", asyncHandler(StkPushController));

export default stkRoute;
