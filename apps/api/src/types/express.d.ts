import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      merchantId?: string;
      timestamp?: string;
    }
  }
}
