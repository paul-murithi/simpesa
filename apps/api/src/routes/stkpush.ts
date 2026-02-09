import { Router } from "express";
import StkPushController from "../controller/StkPush.controller.js";

const stkRoute = Router();

stkRoute.post("/v1/processrequest", StkPushController);

export default stkRoute;
