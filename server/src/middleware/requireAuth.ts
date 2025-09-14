// src/middleware/requireAuth.ts
import type { Request, Response, NextFunction } from "express";
import { getSession, touchSession } from "../services/auth.session.service";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const sid = req.cookies?.sid; // ensure cookie parser middleware
  if (!sid) return res.sendStatus(401);

  const sess = await getSession(sid);
  if (!sess) return res.sendStatus(401);

  // attach to req
  (req as any).user = { id: sess.userId, device: sess.device };
  await touchSession(sid);
  next();
}
