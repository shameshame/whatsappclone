// server/src/routes/session.routes.ts
import { Router } from "express";
import type { Server as SocketIOServer } from "socket.io";
import {
  createSession, markValidated, getSocketId, consumeAndExpire
} from "../services/session.service";

export const sessionRouter = Router();

// POST /api/session  → create & return sessionId
sessionRouter.post("/", async (req, res) => {
  const sessionId = await createSession();
  res.json({ sessionId, ttlSeconds: Number(process.env.TTL_SECONDS ?? 120) });
});

// POST /api/session/validate  → mobile hit
sessionRouter.post("/validate", async (req, res) => {
  const { sessionId } = req.body as { sessionId?: string };
  if (!sessionId) return res.status(400).json({ ok: false, message: "Missing sessionId" });

  const status = await markValidated(sessionId);
  if (status === "unknown") return res.status(404).json({ ok: false, message: "Unknown session" });
  if (status === "expired") return res.status(410).json({ ok: false, message: "Session expired" });

  const io = req.app.get("io") as SocketIOServer;
  const socketId = await getSocketId(sessionId);
  if (socketId) {
    io.to(socketId).emit("session-validated", { sessionId });
    await consumeAndExpire(io, sessionId, "used"); // one-time token
  }
  return res.json({ ok: true });
});
