import { Router } from "express";
import { AuthService } from "../services/auth.service.js";

const router = Router();
const authService = new AuthService();

router.post("/register", async (req, res, next) => {
  try {
    const { shortCode, callbackUrl } = req.body;
    
    if (!shortCode || !callbackUrl) {
      return res.status(400).json({ error: "shortCode and callbackUrl are required" });
    }

    await authService.registerMerchant({ shortCode, callbackUrl });
    res.json({ success: true, firstRun: false });
  } catch (error) {
    next(error);
  }
});

export default router;
