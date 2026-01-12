import { ChatMemberRole } from "@prisma/client";
import { ChatMemberWithUser, ChatWithSummaryRelations, LastMessageSelected } from "../db/chat/types";
import { ChatSummary } from "@shared/types/chatSummary";

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

export function populateLastMessageProp(lastMessage:LastMessageSelected|null) {

    return lastMessage && {
          id: lastMessage.id,
          text: lastMessage.isDeleted ? null : lastMessage.text,
          kind: lastMessage.kind,
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

export function toChatSummary(
  chat: ChatWithSummaryRelations,
  meId: string
): ChatSummary {
  const lastMessage = chat.messages[0] ?? null;
  const myMember = chat.members.find(member => member.user.id === meId) ?? null;

  return {
    id: chat.id,
    type: chat.type, // "DM" | "GROUP"
    name: chat.name,
    createdAt: chat.createdAt.toISOString(),
    updatedAt: chat.updatedAt.toISOString(),
    lastMessageAt: chat.lastMessageAt
      ? chat.lastMessageAt.toISOString()
      : null,
    lastMessage: populateLastMessageProp(lastMessage),
    participants: populateParticipantsList(chat.members),
    me: myMember
      ? {
          role: myMember.role,
          unreadCount: myMember.unreadCount,
        }
      : null,
  };
}
