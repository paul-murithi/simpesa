import { Router } from "express";
import { StkPushController } from "../controllers/StkPush.controller.js";
import { timestampMiddleware } from "../middleware/timestamp.middleware.js";

const stkRoute = Router();

stkRoute.use(timestampMiddleware);
stkRoute.post("/v1/processrequest", StkPushController);

export default stkRoute;
