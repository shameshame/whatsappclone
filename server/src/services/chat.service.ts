import { RequestHandler } from "express";
import { deterministicId } from "../chat/dm";
import { PrismaClient } from "@prisma/client";
import { loadOwnedMessageOrThrow, assertWithinEditWindowOrThrow } from "../chat/dm.guards";
import { requireAuth } from "../middleware/requireAuth";



const prisma = new PrismaClient();

const CHAT_NS = "/chat";

function emitToChatRoom(io: any, room: string, event: string, payload: any) {
  
  // io.of will return the namespace (creates if missing) — same namespace instance used by requireSocketAuth
  io?.of(CHAT_NS).to(room).emit(event, payload);
}


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
  emitToChatRoom(io, chatId, "dm:new", {
    id: created.id, chatId: created.chatId, senderId: created.senderId,
    text: created.text, createdAt: created.createdAt.toISOString(),
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


// PATCH /api/dm/:peerId/messages/:messageId  { content: string }
export const editMessage: RequestHandler= async (req, res) => {
  const me = (req as any).user.id as string;
  const { peerId, messageId } = req.params;
  const { content } = (req.body ?? {}) as { content?: string };

  if (typeof content !== "string" || content.trim().length === 0) {
    return res.status(400).json({ ok: false, code: "bad-content" });
  }

  const chatId = deterministicId(me, peerId as string);

  try {
    const msg = await loadOwnedMessageOrThrow(messageId, me, chatId);
    if (msg.isDeleted) return res.status(409).json({ ok: false, code: "already-deleted" });

    assertWithinEditWindowOrThrow(msg);

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { text: content.trim(), editedAt: new Date() },
      select: { id: true, chatId: true, senderId: true, text: true, editedAt: true },
    });

    // Notify room via Socket.IO
    const io = req.app.get("io");
    emitToChatRoom(io, chatId, "dm:message-updated", { message: updated });
    

    return res.json({ ok: true, message: updated });
  
  } catch (err: any) {
    const status = err?.status ?? 500;
    return res.status(status).json({ ok: false, code: err?.message || "server-error" });
  }
};

// Delete message (soft delete)
// DELETE /api/dm/:peerId/messages/:messageId
export const deleteMessage: RequestHandler = async (req, res) => {
  const me = (req as any).user.id as string;
  const { peerId, messageId } = req.params;

  const chatId = deterministicId(me, peerId as string);

  try {
    
    const message = await loadOwnedMessageOrThrow(messageId, me, chatId);
    if (message.isDeleted) {
      return res.status(409).json({ ok: false, code: "already-deleted" });
    }

    const deleted = await prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true, deletedAt: new Date(), text: "" }, // blank out content
      select: { id: true, chatId: true, senderId: true, isDeleted: true, deletedAt: true },
    });

    const io = req.app.get("io");
    emitToChatRoom(io, chatId, "dm:message-deleted", { messageId: deleted.id });
    
    return res.json({ ok: true });
  
  } catch (err: any) {
    const status = err?.status ?? 500;
    return res.status(status).json({ ok: false, code: err?.message || "server-error" });
  }
};