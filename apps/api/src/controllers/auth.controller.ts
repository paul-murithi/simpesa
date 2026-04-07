import type { RequestHandler } from "express";
import { StkPushService } from "../services/stkPush.service.js";
import { logger, UnauthorizedError } from "@app/utils";

const service = new StkPushService();

export const authController: RequestHandler = async (req, res) => {};
