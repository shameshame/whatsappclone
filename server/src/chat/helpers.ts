import { ChatMemberRole } from "@prisma/client";
import { ChatMemberWithUser, LastMessageSelected } from "../db/chat/types";

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
