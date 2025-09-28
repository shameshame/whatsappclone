import {Request} from "express";


export function getExpectedOrigin(req:Request) {
  // Use the Origin header the browser sent to your API (proxied through Vite/ngrok)
  const origin = req.get("origin");
  if (!origin) throw new Error("Missing Origin");
  return origin; // ex. "https://513f9dd373e8.ngrok-free.app"
}

export function getRpIdFromOrigin(origin: string) {
  return new URL(origin).hostname; // ex. "513f9dd373e8.ngrok-free.app"
}
