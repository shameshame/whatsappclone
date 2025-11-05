// server/src/realtime/attachSocket.ts
import type { Server } from "socket.io";
import { deterministicId } from "../chat/dm";

export function attachSocket(io: Server) {
  io.on("connection", (socket) => {
    const me = (socket as any).user.id as string;

    socket.on("dm:join", ({ peerId }: { peerId: string }) => {
      socket.join(deterministicId(me, peerId));
    });

    socket.on("dm:leave", ({ peerId }: { peerId: string }) => {
      socket.leave(deterministicId(me, peerId));
    });
  });
}
