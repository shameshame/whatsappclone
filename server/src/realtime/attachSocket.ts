// server/src/realtime/attachSocket.ts
import type { Server, Socket } from "socket.io";
import { deterministicId } from "@shared/chat/dmId";
import { assertMemberOfChat } from "../db/chat/chat";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export function attachSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    const me = (socket as any).user?.id as string;

    // ✅ room for syncing across this user's devices
    socket.join(`user:${me}`); 

    // ✅ works for BOTH DM and GROUP, because chatId is the Chat.id
    socket.on("chat:join", async ({ chatId }: { chatId: string }) => {
      try {
        // security: make sure this user actually belongs to that chat
        await assertMemberOfChat(prisma, chatId, me);
        socket.join(chatId);
      } catch {
        socket.emit("chat:error", { chatId, code: "not-member" });
      }
    });

    socket.on("chat:leave", ({ chatId }: { chatId: string }) => {
      socket.leave(chatId);
    });

    // (optional) backwards compatibility if you still open DMs by peerId
    socket.on("dm:join", ({ peerId }: { peerId: string }) => {
      const chatId = deterministicId(me, peerId);
      socket.join(chatId);
    });

    socket.on("dm:leave", ({ peerId }: { peerId: string }) => {
      const chatId = deterministicId(me, peerId);
      socket.leave(chatId);
    });
  });
}
