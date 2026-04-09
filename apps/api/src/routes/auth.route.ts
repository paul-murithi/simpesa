import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.post("/generate", authController);

export default authRouter;
