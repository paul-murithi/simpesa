import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.get("/generate", authController);

export default authRouter;
