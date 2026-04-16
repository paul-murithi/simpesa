import { Router } from "express";
import {
  getTransactionsController,
  streamTransactionsController,
} from "../controllers/transactions.controller.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.get("/", asyncHandler(getTransactionsController));
router.get("/stream", streamTransactionsController);

export default router;
