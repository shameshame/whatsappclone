import { RequestHandler } from "express";
import { deterministicId } from "@shared/chat/dmId";
import { PrismaClient } from "@prisma/client";
import { allChatsQuery, ensureDmChat } from "../db/chat/chat";
import { loadOwnedMessageOrThrow, assertWithinEditWindowOrThrow } from "../chat/dm.guards";
import { LastMessageSelected, ChatMemberWithUser} from "../db/chat/types";




const prisma = new PrismaClient();

const CHAT_NS = "/chat";

function emitToChatRoom(req: any, room: string, event: string, payload: any) {
  try{
      const io = req.app.get("io");
      // io.of will return the namespace (creates if missing) — same namespace instance used by requireSocketAuth
      io?.of(CHAT_NS).to(room).emit(event, payload);
    } catch(err){
      console.warn("emitToChatRoom error:",err);
    }
}

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

function populateLastMessageProp(lastMessage:LastMessageSelected|null) {

    return lastMessage && {
          id: lastMessage.id,
          text: lastMessage.isDeleted ? null : lastMessage.text,
          kind: lastMessage.kind,
          createdAt: lastMessage.createdAt,
          editedAt: lastMessage.editedAt,
          isDeleted: lastMessage.isDeleted,
          sender: {
            id: lastMessage.author.id,
            displayName: lastMessage.author.displayName,
            handle: lastMessage.author.handle,
          },
    }
}

function populateParticipantsList(members:ChatMemberWithUser[]) {
  return members.map(member => ({
          id: member.user.id,
          displayName: member.user.displayName,
          handle: member.user.handle,
          role: member.role,
        }))

}

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

export const sendMessage: RequestHandler = async (req, res) => {
  const parsed = inputCheckerForSendMessage(req, res);
  if (!parsed) return;
  const { me, peerId, text } = parsed;

  try {
    const {chatId,created} = await prisma.$transaction(async (transaction) => {
      // Make sure chat + membership exist
      const chatId = await ensureDmChat(transaction, me, peerId);

      // Insert message
      const created = await transaction.message.create({
        data: {
          chatId,
          senderId: me,
          text,
          kind: "text",
        },
        select: {
          id: true, text: true, kind: true, createdAt: true,
          senderId: true,
          author: { select: { id: true, displayName: true, handle: true } },
        },
      });

      // Update chat’s lastMessageAt for sorting
      await transaction.chat.update({
        where: { id: chatId },
        data: { lastMessageAt: created.createdAt },
      });

      return { chatId, created };
    });
    
    emitToChatRoom(req,chatId, "dm:new", { chatId, message: created });
    
    return res.json({ ok: true,chatId, message:created });
  } catch (err) {
    console.error("sendDmMessage error:", err);
    return res.status(500).json({ ok: false, message: "send-failed" });
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