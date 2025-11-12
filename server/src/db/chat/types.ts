import { Prisma } from "@prisma/client";
import { lastMessageSelect, memberWithUserSelect } from "./queries";


//types
export type LastMessageSelected = Prisma.MessageGetPayload<typeof lastMessageSelect>;
export type ChatMemberWithUser = Prisma.ChatMemberGetPayload<typeof memberWithUserSelect>;