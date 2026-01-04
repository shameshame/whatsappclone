export type ReactActionPayload = {
  messageId: string;
  emoji: string;
  chatId: string;
  userId: string;
};


export type ReactionSummary = { emoji: string; count: number; reactedByMe: boolean };