import { Router, type Request, type Response } from "express";

const stkRoute = Router();

stkRoute.post("stkpush/v1/processrequest", (req: Request, res: Response) => {
  res.status(200).json({ success: "true" });
});
