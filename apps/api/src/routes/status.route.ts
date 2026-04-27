import { Router } from "express";
import { AuthService } from "../services/auth.service.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({ firstRun: AuthService.getFirstRunStatus() });
});

export default router;
