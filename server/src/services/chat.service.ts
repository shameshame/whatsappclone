import { RequestHandler } from "express";
import { deterministicId } from "../chat/dm";
import { PrismaClient } from "@prisma/client";



const prisma = new PrismaClient();


export const getChatHistory :RequestHandler = async(req: any,res:any)=>{
   const me = (req as any).user.id as string;
  const { peerId } = req.params;
  const beforeISO = req.query.before as string | undefined;
  const limit = Math.min(Number(req.query.limit ?? 20), 100);

  const chatId = deterministicId(me, peerId);
  const before = new Date(beforeISO ?? Date.now());

  
  const rows = await prisma.message.findMany({
    where: { chatId, createdAt: { lt: before } },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
  });

  const messages = rows.slice(0, limit).reverse(); // newest last for UI
  const nextCursor =
    rows.length > limit ? rows[limit]?.createdAt.toISOString() : null;

  res.json({
    messages: messages.map(message => ({
      id: message.id,
      chatId: message.chatId,
      senderId: message.senderId,
      text: message.text,
      createdAt: message.createdAt.toISOString(),
    })),
    nextCursor,
  });

}

export const createMessage: RequestHandler = async (req, res) => {
  const me = (req as any).user.id as string;
  const { peerId } = req.params;
  const { text } = (req.body ?? {}) as { text?: string };

  const trimmed = (text ?? "").trim();
  if (!trimmed) return res.status(400).json({ ok: false, message: "empty" });
  if (trimmed.length > 4000) return res.status(413).json({ ok: false, message: "too-long" });

  const chatId = deterministicId(me, peerId as string);
  const created = await prisma.message.create({
    data: { chatId, senderId: me, text: trimmed },
  });

  // fan-out via Socket.IO room
  const io = req.app.get("io");
  io.to(chatId).emit("dm:new", {
    id: created.id,
    chatId: created.chatId,
    senderId: created.senderId,
    text: created.text,
    createdAt: created.createdAt.toISOString(),
  });

  res.json({
    ok: true,
    message: {
      id: created.id,
      chatId: created.chatId,
      senderId: created.senderId,
      text: created.text,
      createdAt: created.createdAt.toISOString(),
    },
  })
}