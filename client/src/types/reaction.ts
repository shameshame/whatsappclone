export type MessageReactionEvent = {
  chatId: string;
  messageId: string;
  emoji: string;
  userId: string;
  action?: "added" | "removed"; // optional
  summary: { emoji: string; count: number; reactedByMe: boolean };
};

export type ReactionSummary = {
  emoji: string;
  count: number;
  reactedByMe: boolean;
};