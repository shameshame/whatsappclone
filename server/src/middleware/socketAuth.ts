// socket middleware
import type { Server, Socket,Namespace } from "socket.io";
import { authFromSid } from "../auth/shared";
import * as cookie from "cookie"; // npm i cookie

function getCookie(socket: Socket, name: string): string | undefined {
  const raw = socket.handshake.headers.cookie;
  if (!raw) return;
  const parsed = cookie.parse(raw);
  return parsed[name];
}

export function requireSocketAuth(io: Server | Namespace) {
  io.use(async (socket, next) => {
    try {
      const sid = getCookie(socket, "sid");
      if (!sid) return next(new Error("unauthorized"));

      const ctx = await authFromSid(sid);
      if (!ctx) return next(new Error("unauthorized"));

      (socket as any).user = { id: ctx.userId, device: ctx.device };
      next();
    } catch (err) {
      next(err as Error);
    }
  });
}
