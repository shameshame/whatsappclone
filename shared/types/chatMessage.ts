import { ReactionSummary } from "./reactionSummary";

export type ChatMessage = {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: Date |string|number; // ISO
  replyToId?: string | null;
  reactions?: ReactionSummary[];
};