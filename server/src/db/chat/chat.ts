import { PrismaClient,ChatType,Prisma, ChatMemberRole } from "@prisma/client";
import { chatWithMembersAndLastMessageArgs } from "./queries";
import { deterministicId } from "@shared/chat/dmId";
import { buildMemberRows } from "server/src/chat/helpers";
import { ChatWithSummaryRelations } from "./types";



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
  tx: Prisma.TransactionClient,
  chatId: string,
  userId: string
) {
  const member = await tx.chatMember.findUnique({
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