// server/src/services/session.service.ts
import { randomUUID } from "crypto";
import type { Server as SocketIOServer } from "socket.io";
import { redis } from "../redis";

const TTL = Number(process.env.TTL_SECONDS ?? 120);

const key = (id: string) => `session:${id}`;

export async function createSession(): Promise<string> {
  const id = randomUUID();
  // Create the hash and set TTL atomically-ish
  await redis.hSet(key(id), { validated: "0" });
  await redis.expire(key(id), TTL);
  return id;
}

export async function registerSocket(sessionId: string, socketId: string) {
  const k = key(sessionId);
  const exists = await redis.exists(k);
  if (!exists) return false;

  await redis.hSet(k, { socketId });
  // keep existing TTL (don’t renew)
  return true;
}

export async function markValidated(sessionId: string) {
  const k = key(sessionId);
  const exists = await redis.exists(k);
  if (!exists) return "unknown" as const;

  const ttl = await redis.ttl(k);
  if (ttl <= 0) return "expired" as const;

  await redis.hSet(k, { validated: "1" });
  return "ok" as const;
}

export async function getSocketId(sessionId: string) {
  return (await redis.hGet(key(sessionId), "socketId")) || undefined;
}

export async function isValidated(sessionId: string) {
  return (await redis.hGet(key(sessionId), "validated")) === "1";
}

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
export function startSweeper(io: SocketIOServer) {
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
