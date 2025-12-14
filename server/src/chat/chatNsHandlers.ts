import type { Namespace } from "socket.io";

import { assertMemberOfChat } from "../db/chat/chat";
import { PrismaClient } from "@prisma/client";

type JoinPayload = { chatId: string };

const prisma = new PrismaClient();

export function attachChatNamespaceHandlers(chatNamespace: Namespace) {
  chatNamespace.on("connection", (socket) => {
    const me = (socket as any).user?.id as string | undefined;
    console.log("chat namespace connected", socket.id, me);

    // Join a chat room by chatId (DM or GROUP)
    socket.on("chat:join", async ({ chatId }: JoinPayload) => {
      if (!me || !chatId) return;

      const member = await assertMemberOfChat(prisma, chatId, me);
      if (!member){
        socket.emit("chat:error", { chatId, code: "not-a-member" });
        return;
      }  // not a member, ignore

      socket.join(chatId);
      // optional ack
      socket.emit("chat:joined", { chatId });
    });

    socket.on("chat:leave", ({ chatId }: JoinPayload) => {
      if (!chatId) return;
      socket.leave(chatId);
      socket.emit("chat:left", { chatId });
    });

    socket.on("disconnect", (reason) => {
      console.log("chat namespace disconnected", socket.id, reason);
    });
  });
}
