import { RequestHandler } from "express";
import { deterministicId } from "@shared/chat/dmId";
import { PrismaClient } from "@prisma/client";
import { allChatsQuery, assertMemberOfChat, ensureDmChat } from "../db/chat/chat";
import { loadOwnedMessageOrThrow, assertWithinEditWindowOrThrow } from "../chat/dm.guards";
import { emitToChatRoom, populateLastMessageProp, populateParticipantsList } from "../chat/helpers";


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
    const chatId = await ensureDmChat(prisma, me, peerId);

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: {
        id: true,
        type: true,
        name: true,
        lastMessageAt: true,
        // you can also select members / lastMessage if you want
      },
    });

    if (!chat) {
      return res.status(500).json({ ok: false, message: "chat-not-found" });
    }

    

    return res.json({ ok: true, chat });
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
    const payload = chats.map(chat => {
      const lastMessage = chat.messages[0] ?? null;
      const myMemberRow = chat.members.find(member => member.user.id === me) || null;

      return {
        id: chat.id,
        type: chat.type,              // "DM" | "GROUP"
        name: chat.name,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        lastMessageAt: chat.lastMessageAt,
        lastMessage: populateLastMessageProp(lastMessage),

        // every participant
        participants: populateParticipantsList(chat.members),

        // info specific to *this* user
        me: myMemberRow && {
          role: myMemberRow.role,
          unreadCount: myMemberRow.unreadCount,
        },
      };
     });
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


    emitToChatRoom(req, chatId, "chat:message", {message: result });
    

    return res.json({ ok: true, message: result });
  } catch (err: any) {
    const status = err?.status ?? 500;
    return res.status(status).json({ ok: false, message: err?.message ?? "send-failed" });
  }
};




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
    emitToChatRoom(req, chatId, "dm:message-updated", { message: updated });
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

    
    emitToChatRoom(req, chatId, "dm:message-deleted", { messageId: deleted.id });
    return res.json({ ok: true });
  
  } catch (err: any) {
    const status = err?.status ?? 500;
    return res.status(status).json({ ok: false, code: err?.message || "server-error" });
  }
};