
import { randomBytes } from "crypto";
import { SignJWT } from "jose";
import { redis } from "../redis";


export const authCodeKey = (code: string) => `authcode:${code}`;

export async function issueTokens(userId: string, deviceInfo?: any) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
  const accessToken = await new SignJWT({ sub: userId, typ: "access", di: deviceInfo?.name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("your.app")
    .setAudience("your.app")
    .setExpirationTime("15m")
    .sign(secret);

  const refreshToken = await new SignJWT({ sub: userId, typ: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("your.app")
    .setAudience("your.app")
    .setExpirationTime("30d")
    .sign(secret);

  return { accessToken, refreshToken };
}

export function setAuthCookies(res: any, { accessToken, refreshToken }: { accessToken: string; refreshToken: string }) {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export async function createAuthCode(payload: { userId: string; deviceInfo?: any }, ttlSec = 60) {
  const code = randomBytes(32).toString("base64url");
  await redis.set(authCodeKey(code), JSON.stringify(payload), { EX: ttlSec, NX: true });
  return code;
}

export async function takeAuthCode(code: string): Promise<{ userId: string; deviceInfo?: any } | undefined> {
  // If your redis version supports GETDEL:
  // const json = await redis.getdel(acKey(code));
  const json = await redis.eval(
    `
    local v = redis.call('GET', KEYS[1])
    if v then redis.call('DEL', KEYS[1]) end
    return v
    `,
    { keys: [authCodeKey(code)] }
  );
  return json ? JSON.parse(json as string) : undefined;
}
