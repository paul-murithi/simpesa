import { Router } from "express";
import StkPushController from "../controller/StkPush.controller.js";

const stkRoute = Router();

stkRoute.post("/processrequest", StkPushController);

export default stkRoute;
