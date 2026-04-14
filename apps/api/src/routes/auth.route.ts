import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const authRouter = Router();

authRouter.post("/generate", asyncHandler(authController));

export default authRouter;
