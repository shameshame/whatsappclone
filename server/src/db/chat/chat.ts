import { PrismaClient} from "@prisma/client";
import { chatWithMembersAndLastMessageArgs } from "./queries";



const prisma = new PrismaClient();



export const allChatsForCurrentUser = async (userId:string)=> {
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