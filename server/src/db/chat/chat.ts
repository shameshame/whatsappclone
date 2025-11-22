import { PrismaClient,ChatType,Prisma } from "@prisma/client";
import { chatWithMembersAndLastMessageArgs } from "./queries";
import { deterministicId } from "../../chat/dm";


const prisma = new PrismaClient();



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

export async function ensureDmChat(prismaTx: PrismaClient |Prisma.TransactionClient, user1: string, user2: string) {
  const id = deterministicId(user1, user2);

  // 1) Upsert the Chat
  await prismaTx.chat.upsert({
    where: { id },
    create: { id, type: ChatType.DM },
    update: {}, // nothing to update for DM shell
  });

  // 2) Ensure both ChatMember rows exist
  await prismaTx.chatMember.upsert({
    where: { chatId_userId: { chatId: id, userId: user1 } },
    create: { chatId: id, userId: user1 },
    update: {},
  });
  await prismaTx.chatMember.upsert({
    where: { chatId_userId: { chatId: id, userId: user2 } },
    create: { chatId: id, userId: user2 },
    update: {},
  });

  return id;
}