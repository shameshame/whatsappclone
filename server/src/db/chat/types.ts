import { Prisma } from "@prisma/client";
import { chatWithMembersAndLastMessageArgs, lastMessageSelect, memberWithUserSelect, voiceMessageSelect } from "./queries";


//types
export type LastMessageSelected = Prisma.MessageGetPayload<{ select: typeof lastMessageSelect; }>;
export type ChatMemberWithUser = Prisma.ChatMemberGetPayload<typeof memberWithUserSelect>;
export type ChatWithSummaryRelations = Prisma.ChatGetPayload<typeof chatWithMembersAndLastMessageArgs>;
export type VoiceMessage = Prisma.MessageGetPayload<{select: typeof voiceMessageSelect;}>;