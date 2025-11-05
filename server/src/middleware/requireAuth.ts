// src/middleware/requireAuth.ts
import type { Request, Response, NextFunction } from "express";
import { authFromSid } from "../auth/shared";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const sid = req.cookies?.sid; // ensure cookie parser middleware
  if (!sid) return res.sendStatus(401);

  const context = await authFromSid(sid);
  if (!context) return res.sendStatus(401);

  (req as any).user = { id: context.userId, device: context.device };
  next();
}
