
import { randomBytes } from "crypto";

import { redis } from "../redis";

import { AuthCodePayload } from "../types/authPayload";


export const authCodeKey = (sessionId: string, code: string) => `auth:${sessionId}:${code}`;


export async function createAuthCode(payload: Omit<AuthCodePayload, "issuedAt">, ttlSec = 60) {
  const code = randomBytes(32).toString("base64url");
  const value = JSON.stringify({ ...payload, issuedAt: Date.now() });
  const ok =await redis.set(authCodeKey(code,payload.sessionId as string), value, { EX: ttlSec, NX: true });
  
  if (!ok) throw new Error("authcode-collision");
  
  return code;
}

export async function takeAuthCode(sessionId: string,code: string): Promise<AuthCodePayload | null> {
 
 
  // Fallback: tiny Lua script to emulate GETDEL atomically

  const acKey = authCodeKey(sessionId,code);

  // Fallback: tiny Lua script to emulate GETDEL atomically
  const LUA_GETDEL = `
    local value = redis.call('GET', KEYS[1])
    if not value then return nil end
    redis.call('DEL', KEYS[1])
    return value
  `;
  // node-redis v4 eval signature with options object:
  const raw = (await redis.eval(LUA_GETDEL, { keys: [acKey] })) as string | null;

  return raw ? safeParseAuthCode(raw) : null;
}


function safeParseAuthCode(raw: string): AuthCodePayload | null {
  try {
    const obj = JSON.parse(raw);
    if (!obj || typeof obj.userId !== "string") return null;
    // Optional extra checks: issuedAt recent, sessionId format, etc.
    return obj as AuthCodePayload;
  } catch {
    return null;
  }
}
