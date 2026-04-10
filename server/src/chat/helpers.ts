import { ChatMemberRole } from "@prisma/client";
import { ChatMemberWithUser, LastMessageSelected } from "../db/chat/types";
import { ChatSummary } from "@shared/types/chatSummary";
import { ChatMessage } from "@shared/types/chatMessage";
import { DbLastMessage } from "../types/lastMessage";
import { DbChat } from "@shared/types/dbChat";

const CHAT_NS = "/chat";

export function emitToChatRoom(req: any, room: string, event: string, payload: any) {
  try{
      const io = req.app.get("io");
      // io.of will return the namespace (creates if missing) — same namespace instance used by requireSocketAuth
      io?.of(CHAT_NS).to(room).emit(event, payload);
    } catch(err){
      console.warn("emitToChatRoom error:",err);
    }
}

export function emitToUser(req: any, userId: string, event: string, payload: any) {
  emitToChatRoom(req, `user:${userId}`, event, payload);
}


// helper for API response shaping
export function populateParticipantsList(members:ChatMemberWithUser[]) {
  return members.map(member => ({
          id: member.user.id,
          displayName: member.user.displayName,
          handle: member.user.handle,
          role: member.role,
        }))

}


// helper for DB insertion
export function buildMemberRows(
  chatId: string,
  me: string,
  memberIds: string[],
): { chatId: string; userId: string; role: ChatMemberRole }[] {
  return memberIds.map((uid) => ({
    chatId,
    userId: uid,
    role: uid === me ? ChatMemberRole.ADMIN : ChatMemberRole.MEMBER,
  }));
}

export function normalizeMessage(message: DbLastMessage | null | undefined): ChatMessage | null {
  if (!message) return null;

  return {
    id: message.id,
    chatId: message.chatId, // fill this if selected on backend; otherwise okay for list preview only
    senderId: message.senderId,
    text: message.text ?? undefined,
    createdAt: message.createdAt instanceof Date
    ? message.createdAt
    : new Date(message.createdAt),
    replyToId: message.replyToId ?? null,
    reactions: [],
    type: message.type,
    isDeleted: message.isDeleted ?? false,
    deletedAt: message.deletedAt ?? null,
    voice:
      message.type === "voice"
        ? {
            url: message.voiceUrl ?? "",
            mimeType: message.voiceMimeType ?? "audio/webm",
            durationSec: message.voiceDurationSec ?? 0,
          }
        : undefined,
  };
}

export function populateLastMessageProp(lastMessage:LastMessageSelected|null) {

    return lastMessage && {
          id: lastMessage.id,
          text: lastMessage.isDeleted ? null : lastMessage.text,
          type: lastMessage.type,
          createdAt: lastMessage.createdAt.toISOString(),
          editedAt: lastMessage.editedAt?.toISOString() || null,
          isDeleted: lastMessage.isDeleted,
          sender: {
            id: lastMessage.author.id,
            displayName: lastMessage.author.displayName,
            handle: lastMessage.author.handle,
          },
    }
}

export function toChatSummary(chat: DbChat, me: string): ChatSummary {
  const participants = chat.members.map((member) => ({
    id: member.user.id,
    displayName: member.user.displayName ?? "",
    handle: member.user.handle ?? "",
    role: member.role,
  }));

  const myMembership = chat.members.find((member) => member.user.id === me);

  const lastMessageRow = chat.messages[0] ?? null;
  const lastMessage = normalizeMessage(lastMessageRow);

  

  return {
    id: chat.id,
    type: chat.type,
    name: chat.name,
    createdAt: String(chat.createdAt),
    updatedAt: String(chat.updatedAt),
    lastMessageAt: chat.lastMessageAt ? String(chat.lastMessageAt) : null,
    lastMessage,
    participants,
    me: myMembership
      ? {
          role: myMembership.role,
          unreadCount: myMembership.unreadCount,
        }
      : null,
  };
}






