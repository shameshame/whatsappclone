// src/auth/cookies.ts
import type { Response } from "express";

export function setSessionCookie(res: Response, sid: string) {
  res.cookie("sessionId", sid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000, // align with Redis TTL
  });
}
