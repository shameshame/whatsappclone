import { Prisma } from "@prisma/client";
import { chatWithMembersAndLastMessageArgs, lastMessageSelect, memberWithUserSelect } from "./queries";


//types
export type LastMessageSelected = Prisma.MessageGetPayload<typeof lastMessageSelect>;
export type ChatMemberWithUser = Prisma.ChatMemberGetPayload<typeof memberWithUserSelect>;
export type ChatWithSummaryRelations = Prisma.ChatGetPayload<typeof chatWithMembersAndLastMessageArgs>;