// server/src/routes/session.routes.ts
import { Router } from "express";
import type { Server as SocketIOServer } from "socket.io";
import {
  createSession, approveIfValid, getSocketId, consumeAndExpire,getStatus,createAuthCode
} from "../services/session.service";
import crypto from 'crypto';

export const sessionRouter = Router();


/** GET /api/session/:id/status -> { status, ttl } (desktop fallback) */
sessionRouter.get("/:id/status",async(req,res)=>{
  const { status, ttl } = await getStatus(req.params.id ?? "");
  res.json({ status, ttl });
})


// POST /api/session  → create & return sessionId
sessionRouter.post("/", async (req, res) => {
 const { sessionId, challenge, ttl } = await createSession();
  res.json({ sessionId, challenge, ttl });
});

// POST /api/session/validate  → mobile hit
sessionRouter.post("/validate", async (req, res) => {
  
  const userId = req.body.user?.id; // <- ensure your auth middleware sets this
  if (!userId) return res.status(401).json({ ok: false, message: "Unauthorized" });
  
  const { sessionId,challenge,deviceInfo } = req.body ?? {}
  if (!sessionId || !challenge) return res.status(400).json({ ok: false, message: "Missing fields" });

  const status = await approveIfValid(sessionId,challenge);
  
  if (status === "unknown") return res.status(404).json({ ok: false, message: "Unknown session" });
  if (status === "expired") return res.status(410).json({ ok: false, message: "Session expired" });
  if (status === "not-pending") return res.status(409).json({ ok: false, message: "Not pending" });
  if (status === "bad-challenge") return res.status(400).json({ ok: false, message: "Bad challenge" });

  const io = req.app.get("io") as SocketIOServer;
  const socketId = await getSocketId(sessionId);
 
  // mint one-time auth code (TTL ~ 60s)
  const authCode = await createAuthCode({ userId, deviceInfo });

  if (socketId) {
    io.to(socketId).emit("session-approved", { sessionId, authCode });
  }

   await consumeAndExpire(io,sessionId, "used");

  return res.json({ ok: true });
});



