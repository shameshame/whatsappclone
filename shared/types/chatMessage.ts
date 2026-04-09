import { ReactionSummary } from "./reactionSummary";
import { VoiceAttachment } from "./voiceAttachment";

export type ChatMessageType = "text" | "voice" | "image";

export type ChatMessage = {
  id: string;
  chatId: string;
  senderId: string;
  text?: string;
  voice?: VoiceAttachment;
  createdAt: Date |string|number; // ISO
  replyToId?: string | null;
  reactions?: ReactionSummary[];
  type: ChatMessageType;
  isDeleted?: boolean;
  deletedAt?: Date |string|number | null;
};