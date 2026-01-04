import { PrismaClient,ChatType,Prisma, ChatMemberRole } from "@prisma/client";
import { chatWithMembersAndLastMessageArgs } from "./queries";
import { deterministicId } from "@shared/chat/dmId";
import { buildMemberRows } from "server/src/chat/helpers";
import { ChatWithSummaryRelations } from "./types";
import { ReactActionPayload, ReactionSummary } from "server/src/types/reactActionPayload";



const prisma = new PrismaClient();

type EnsureChatArgs = {
  id: string;
  type: ChatType;
  name?: string | null;
  members: { userId: string; role: ChatMemberRole }[];
};





export const allChatsQuery = async (userId:string)=> {
  const chats = await prisma.chat.findMany({
      where: {
        members: {
          some: { userId},
        },
      },
      orderBy: {
        // use lastMessageAt if you keep it updated on every new message;
        // otherwise you could use updatedAt
        lastMessageAt: "desc",
      },
      ...chatWithMembersAndLastMessageArgs,
    });
    
    return chats;
}

//If you only care about id in some places,then your existing code that only needs the chatId can keep its old style
async function ensureDmChatId(
  tx: PrismaClient | Prisma.TransactionClient,
  user1: string,
  user2: string
): Promise<string> {
  const chat = await ensureDmChat(tx, user1, user2);
  return chat.id;
}

async function ensureChatWithMembers(
  tx: PrismaClient | Prisma.TransactionClient,
  { id, type, name = null, members }: EnsureChatArgs
): Promise<ChatWithSummaryRelations> {
  // 1) Upsert the chat shell (works for DM or GROUP)
  await tx.chat.upsert({
    where: { id },
    create: { id, type, name },
    update: { name }, // for DM you can also leave {} if you never change name
  });

  // 2) Ensure all ChatMember rows exist
  await tx.chatMember.createMany({
    data: members.map(m => ({
      chatId: id,
      userId: m.userId,
      role: m.role,
    })),
    skipDuplicates: true,
  });

  // 3) Return with members + last message
  return tx.chat.findUniqueOrThrow({
    where: { id },
    ...chatWithMembersAndLastMessageArgs,
  });
}




export async function ensureDmChat(
  tx: PrismaClient | Prisma.TransactionClient,
  user1: string,
  user2: string
): Promise<ChatWithSummaryRelations> {
  const id = deterministicId(user1, user2);

  const members: { userId: string; role: ChatMemberRole }[] = [
    { userId: user1, role: ChatMemberRole.MEMBER },
    { userId: user2, role: ChatMemberRole.MEMBER },
  ];

  return ensureChatWithMembers(tx, {
    id,
    type: ChatType.DM,
    members,
  });
}

export async function assertMemberOfChat(
  db: Prisma.TransactionClient | PrismaClient,
  chatId: string,
  userId: string
) {
  const member = await db.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId } },
    select: { role: true, chat: { select: { type: true } } },
  });
  if (!member) throw Object.assign(new Error("not-member"), { status: 403 });
  return member; // includes role + chat.type, useful for perms
}

export async function upsertGroupChat(members: string[], me: string,name: string):Promise<ChatWithSummaryRelations> {

   return prisma.$transaction(tx =>
    ensureChatWithMembers(tx, {
      id: crypto.randomUUID(),
      type: ChatType.GROUP,
      name,
      members: buildMemberRows("", me, members), // chatId will be set in ensureChatWithMembers
    })
  );

}


export async function getReactionCounts(userId: string,messageIds:string[]):Promise<Map<string, ReactionSummary[]>> {
  const counts = await prisma.messageReaction.groupBy({
        by: ["messageId", "emoji"],
        where: { messageId: { in: messageIds } },
        _count: { _all: true },
      });
  
      // ✅ which emojis "me" reacted with (for reactedByMe)
      const mine = await prisma.messageReaction.findMany({
        where: { messageId: { in: messageIds }, userId},
        select: { messageId: true, emoji: true },
      });
  
      const mineSet = new Set(mine.map(r => `${r.messageId}|${r.emoji}`));
  
      // build map: messageId -> ReactionSummary[]
      const reactionsByMessageId = new Map<string, ReactionSummary[]>();
  
      for (const row of counts) {
        const list = reactionsByMessageId.get(row.messageId) ?? [];
        list.push({
          emoji: row.emoji,
          count: row._count._all,
          reactedByMe: mineSet.has(`${row.messageId}|${row.emoji}`),
        });
        reactionsByMessageId.set(row.messageId, list);
      }

      return reactionsByMessageId;
}


export async function removeOrCreateReaction (payload: ReactActionPayload):Promise<{action: "added" | "removed"}> {

  const action = await prisma.$transaction(async (tx) => {
      const { chatId, messageId, emoji, userId } = payload;
  
  
      // 1) must be a member of the chat
      await assertMemberOfChat(tx, chatId, userId);

      // 2) ensure message exists in this chat
      const msg = await tx.message.findFirst({
        where: { id: messageId, chatId },
        select: { id: true, chatId: true, isDeleted: true },
      });
      
      if (!msg) throw Object.assign(new Error("message-not-found"), { status: 404 });
      if (msg.isDeleted) throw Object.assign(new Error("message-deleted"), { status: 409 });

      // 3) toggle behavior: if reaction exists -> remove, else create
      const existing = await tx.messageReaction.findUnique({
        where: { messageId_userId_emoji: { messageId, userId: userId, emoji } },
        select: { id: true },
      });

      if (existing) {
        await tx.messageReaction.delete({
          where: { messageId_userId_emoji: { messageId, userId, emoji } },
        });
        return { action: "removed" as const };
      } 
      else {
        await tx.messageReaction.create({
          data: { messageId, userId: userId, emoji },
        });
        return { action: "added" as const };
      }
    });

    return action;
  }