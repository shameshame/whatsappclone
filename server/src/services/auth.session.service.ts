// auth/session.ts
import { randomBytes } from "crypto";
import { redis } from "../redis";

const SESSION_TTL_SEC = 30 * 24 * 60 * 60; // 30d
const sessionKey = (sid: string) => `sess:${sid}`;

export type SessionData = {
  userId: string;
  device?: { name?: string; ua?: string; tz?: string };
  createdAt: number;
  lastSeen: number;
};

export async function issueAppSession(userId: string, device?: SessionData["device"]) {
  const data: SessionData = { userId, device, createdAt: Date.now(), lastSeen: Date.now() };
  for (let i = 0; i < 3; i++) {
    const sid = randomBytes(32).toString("base64url");
    const ok = await redis.set(sessionKey(sid), JSON.stringify(data), { EX: SESSION_TTL_SEC, NX: true });
    if (ok) return sid;
  }
  throw new Error("session-collision");
}

export async function getSession(sid: string): Promise<SessionData | null> {
  const raw = await redis.get(sessionKey(sid));
  return raw ? (JSON.parse(raw) as SessionData) : null;
}

export async function touchSession(sid: string) {
  const ttl = await redis.ttl(sessionKey(sid));
  if (ttl > 0 && ttl < 15 * 60) await redis.expire(sessionKey(sid), SESSION_TTL_SEC);
}

export async function revokeSession(sid: string) {
  await redis.del(sessionKey(sid));
}
