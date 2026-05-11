import { Router } from "express";
import {
  getMerchantController,
  updateMerchantController,
} from "../controllers/merchant.controller.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", asyncHandler(getMerchantController as any));
router.patch("/", asyncHandler(updateMerchantController as any));

export default router;
