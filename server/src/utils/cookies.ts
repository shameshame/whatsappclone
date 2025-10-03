// src/auth/cookies.ts
import type {Request, Response } from "express";
import type { CookieOptions } from "express-serve-static-core";

function isHttps(req:Request) {
  // works behind vite/ngrok/reverse proxies if trust proxy is configured
  return req.secure || req.get("x-forwarded-proto") === "https";
}

export function setSessionCookie(res: Response, sid: string) {
  res.cookie("sessionId", sid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000, // align with Redis TTL
  });
}


export function ctxCookieOpts(req:Request): CookieOptions {
  const secure = isHttps(req);
  // SameSite:
  // - using Vite proxy (same origin): "lax" is fine
  // - different origins (no proxy): use "none" and secure:true
  const sameSite: CookieOptions["sameSite"] = secure ? "none" : "lax";
  
  return {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    maxAge: 2 * 60 * 1000, // 2 minutes, aligns with Redis TTL
  };
}
