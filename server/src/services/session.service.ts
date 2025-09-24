// server/src/services/session.service.ts
import { randomUUID,randomBytes  } from "crypto";
import type { Server as SocketIOServer } from "socket.io";
import { redis } from "../redis";
import { SessionStatus } from "../types/sessionStatus";
import { PairRecord } from "../types/pairRecord";

const TTL = Number(process.env.TTL_SECONDS ?? 120);
const key = (id: string) => `session:${id}`;


export async function getStatus(sessionId: string): Promise<{ status: SessionStatus | "unknown" | "expired"; ttl: number }> {
  const k = key(sessionId);
  const exists = await redis.exists(k);
  if (!exists) return { status: "unknown", ttl: -2 };

  const ttl = await redis.ttl(k);
  if (ttl <= 0) return { status: "expired", ttl };

  const status = (await redis.hGet(k, "status")) as SessionStatus | null;
  return { status: (status ?? "unknown") as any, ttl };
}

export async function createPairingSession(): Promise<{ sessionId: string; challenge: string; ttl: number }> {
  const sessionId = randomUUID();
  const challenge = randomBytes(32).toString("base64url");

 const record: PairRecord = {
    validated: "0",
    status: "pending",
    challenge,
    createdAt: Date.now().toString(),
  };

  // Create the hash and set TTL atomically-ish
  await redis.hSet(key(sessionId), record);
  await redis.expire(key(sessionId), TTL);
  return { sessionId, challenge, ttl: TTL }
}

export async function registerSocket(sessionId: string, socketId: string) {
  const k = key(sessionId);
  const exists = await redis.exists(k);
  if (!exists) return false;

  await redis.hSet(k, { socketId });
  // keep existing TTL (don’t renew)
  return true;
}

export async function approveIfValid(sessionId: string,challenge: string) {
  const k = key(sessionId);
  const exists = await redis.exists(k);
  if (!exists) return "unknown" as const;

  const ttl = await redis.ttl(k);
  if (ttl <= 0) return "expired" as const;

  const [status, storedChallenge] = await redis.hmGet(k, ["status", "challenge"]);

  if (status !== "pending") return "not-pending" as const;
  if (storedChallenge !== challenge) return "bad-challenge" as const;


  await redis.hSet(k, { validated: "1",status: "approved" });
  return "ok" as const;
}

export async function getSocketId(sessionId: string) {
  return (await redis.hGet(key(sessionId), "socketId")) || undefined;
}

export async function isValidated(sessionId: string) {
  return (await redis.hGet(key(sessionId), "validated")) === "1";
}

// ----- one-time auth code storage -----


// One-time consumption: notify desktop and delete key
export async function consumeAndExpire(io: SocketIOServer, sessionId: string, reason: "used" | "ttl" = "used") {
  const k = key(sessionId);
  const socketId = await redis.hGet(k, "socketId");
  if (socketId) {
    io.to(socketId).emit("session-expired", { sessionId, reason });
  }
  await redis.del(k);
}

// Optional: periodic sweeper (safety net; Redis TTL already handles it)
export function startSweeper(_io: SocketIOServer) {
  setInterval(async () => {
    // Not strictly needed—Redis expires keys automatically.
    // You could scan for near-expiry keys and warn the client if you want.
  }, 30_000);
}

// If mobile validated before desktop joined, emit now
export async function emitPendingIfAny(io: SocketIOServer, sessionId: string) {
  if (await isValidated(sessionId)) {
    io.to((await getSocketId(sessionId))!).emit("session-validated", { sessionId });
    await consumeAndExpire(io, sessionId, "used");
  }
}
