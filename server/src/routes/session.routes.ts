// server/src/routes/session.routes.ts
import { Router } from "express";
import type { Server as SocketIOServer } from "socket.io";
import {
  createPairingSession, approveIfValid, getSocketId, consumeAndExpire,getStatus,
  getMe
} from "../services/session.service";
import { createAuthCode,takeAuthCode } from "../utils/auth";
import { issueAppSession } from "../services/auth.session.service";
import { setSessionCookie } from "../utils/cookies";
import { requireAuth } from "../middleware/requireAuth";
import { redis } from "../redis";

export const sessionRouter = Router();

// - requireAuth: reads `sid` cookie -> loads session from Redis -> attaches req.user and touchSession()
sessionRouter.get("/me",requireAuth,getMe)


/** GET /api/session/:id/status -> { status, ttl } (desktop fallback) */
sessionRouter.get("/:id/status",async(req,res)=>{
  const { status, ttl } = await getStatus(req.params.id ?? "");
  res.json({ status, ttl });
})


// POST /api/session  → create & return sessionId
sessionRouter.post("/", async (_req, res) => {
 const { sessionId, challenge, ttl } = await createPairingSession();
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
 
  // mint one-time auth code (TTL ~ 60s) - correct this call due to the last changes in createAuthCode
  const authCode = await createAuthCode({ userId, sessionId,deviceInfo });

  if (socketId) {
    io.to(socketId).emit("session-approved", { sessionId, authCode });
    
    // Optional: mark the pairing record as "approved"
    await redis.hSet(`pair:${sessionId}`, { status: "approved" });
  }

   await consumeAndExpire(io,sessionId, "used");

  return res.json({ ok: true });
});

sessionRouter.post("/exchange",async (req, res) => {
  const { sessionId, authCode } = req.body ?? {};
  if (!sessionId || !authCode) return res.status(400).json({ ok: false, message: "missing field(s)" });

  // Single-use, short-TTL code from the phone approval step
  const data = await takeAuthCode(sessionId,authCode); // { userId, sessionId?: string, deviceInfo?: any } | null
  if (!data) return res.status(410).json({ ok: false, message: "authCode-expired-or-used" });

  

  // Mint an opaque Redis-backed session and set it as HttpOnly cookie
  const sid = await issueAppSession(data.userId, data.deviceInfo);
  setSessionCookie(res, sid); // HttpOnly; Secure; SameSite=Strict; Path=/

  return res.json({ ok: true });
})



