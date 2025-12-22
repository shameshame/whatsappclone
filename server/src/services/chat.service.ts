import { RequestHandler } from "express";
import { deterministicId } from "@shared/chat/dmId";
import { PrismaClient } from "@prisma/client";
import { allChatsQuery, assertMemberOfChat, ensureDmChat } from "../db/chat/chat";
import { loadOwnedMessageOrThrow, assertWithinEditWindowOrThrow } from "../chat/dm.guards";
import { emitToChatRoom,toChatSummary } from "../chat/helpers";



type ChatIdParams = { chatId: string };

const prisma = new PrismaClient();



function inputCheckerForSendMessage(req:any,res:any):{ me: string; peerId: string; text: string } | null {
   const me = req.user.id as string;
  const { peerId } = req.params;
  const text = String(req.body?.text ?? "").trim();
  
  if (!me) return res.sendStatus(401);
  if (!peerId) return res.status(400).json({ ok: false, message: "bad-peer" });
  if (!text) return res.status(400).json({ ok: false, message: "empty" });
  if (text.length > 4000) return res.status(413).json({ ok: false, message: "too-long" });

  return { me, peerId, text}

}

export const openOrCreateDm: RequestHandler = async (req, res) => {
  const me = (req as any).user.id as string;
  const { peerId } = req.params;

  if (!peerId) {
    return res.status(400).json({ ok: false, message: "missing-peer" });
  }

  try {
    const dmChat = await ensureDmChat(prisma, me, peerId);
    const summary = toChatSummary(dmChat, me);

    return res.json({ ok: true, chat: summary });
  } catch (err) {
    console.error("openOrCreateDm error:", err);
    return res.status(500).json({ ok: false, message: "dm-init-failed" });
  }
};

// GET /api/chat/my-chats

export const getAllMyChats: RequestHandler = async (req, res,next) => {

  try {
    const me = (req as any).user.id as string;
    const chats = await allChatsQuery(me);
    
    // Shape data into a clean payload for the client
    const payload = chats.map(chat => toChatSummary(chat, me));
    res.json({ chats: payload });
  } catch (err) {
    next(err);
  } 

}  


export const getChatHistory :RequestHandler = async(req: any,res:any)=>{
   const me = (req as any).user.id as string;
  const { chatId } = req.params;
  const beforeISO = req.query.before as string | undefined;
  const limit = Math.min(Number(req.query.limit ?? 20), 100);

  // const chatId = deterministicId(me, peerId);
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

// POST /api/chat/:chatId/send
export const sendMessage: RequestHandler<ChatIdParams> = async (req, res) => {
  const me = (req as any).user.id as string;
  const { chatId }  = req.params;
  const text = String(req.body?.text ?? "").trim();
  const tempId = typeof req.body?.tempId === "string" ? req.body.tempId : undefined;

  if (!text) return res.status(400).json({ ok: false, message: "empty" });
  if (text.length > 4000) return res.status(413).json({ ok: false, message: "too-long" });

  try {
    const result = await prisma.$transaction(async (tx) => {
      // must exist (DM or GROUP) and caller must be a member
      await assertMemberOfChat(tx, chatId as string, me);

      const created = await tx.message.create({
        data: { chatId, senderId: me, text, kind: "text" },
        select: {
          id: true, text: true, kind: true, createdAt: true, senderId: true,
          author: { select: { id: true, displayName: true, handle: true } },
        },
      });

      await tx.chat.update({
        where: { id: chatId },
        data: { lastMessageAt: created.createdAt },
      });

      await tx.chatMember.updateMany({
        where: { chatId, userId: { not: me } },
        data: { unreadCount: { increment: 1 } },
      });

      return created;
    });


    emitToChatRoom(req, chatId, "chat:message", { chatId, message: result, tempId });
    

    return res.json({ ok: true, message: result });
  } catch (err: any) {
    const status = err?.status ?? 500;
    return res.status(status).json({ ok: false, message: err?.message ?? "send-failed" });
  }
};




// PATCH /api/chat/:chatId/messages/:messageId  { content: string }
export const editMessage: RequestHandler = async (req, res) => {
  const me = (req as any).user.id as string;
  const { chatId, messageId } = req.params as { chatId: string; messageId: string };
  const { content } = (req.body ?? {}) as { content?: string };

  if (typeof content !== "string" || content.trim().length === 0) {
    return res.status(400).json({ ok: false, code: "bad-content" });
  }

  try {
    // Ensure member of chat (DM or GROUP)
    await assertMemberOfChat(prisma, chatId, me);

    // Ensure ownership + window etc (your existing helpers)
    const msg = await loadOwnedMessageOrThrow(messageId, me, chatId);
    if (msg.isDeleted) return res.status(409).json({ ok: false, code: "already-deleted" });
    assertWithinEditWindowOrThrow(msg.createdAt);

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { text: content.trim(), editedAt: new Date() },
      select: {
        id: true,
        chatId: true,
        senderId: true,
        text: true,
        editedAt: true,
        isDeleted: true,
        deletedAt: true,
        createdAt: true,
        kind: true,
        author: { select: { id: true, displayName: true, handle: true } },
      },
    });

    // ✅ unified event + payload
    emitToChatRoom(req, chatId, "chat:updated", { chatId, message: updated });

    return res.json({ ok: true, message: updated });
  } catch (err: any) {
    const status = err?.status ?? 500;
    return res.status(status).json({ ok: false, code: err?.message || "server-error" });
  }
};


// DELETE /api/chat/:chatId/messages/:messageId
export const deleteMessage: RequestHandler = async (req, res) => {
  const me = (req as any).user.id as string;
  const { chatId, messageId } = req.params as { chatId: string; messageId: string };

  try {
    await assertMemberOfChat(prisma, chatId, me);

    const message = await loadOwnedMessageOrThrow(messageId, me, chatId);
    if (message.isDeleted) return res.status(409).json({ ok: false, code: "already-deleted" });

    const deleted = await prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true, deletedAt: new Date(), text: "" },
      select: { id: true, chatId: true },
    });

    // ✅ unified event + payload (ids array)
    emitToChatRoom(req, chatId, "chat:deleted", { chatId, ids: [deleted.id] });

    return res.json({ ok: true });
  } catch (err: any) {
    const status = err?.status ?? 500;
    return res.status(status).json({ ok: false, code: err?.message || "server-error" });
  }
};
