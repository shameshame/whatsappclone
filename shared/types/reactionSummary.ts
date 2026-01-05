export type ReactionSummary = { emoji: string; count: number; reactedByMe: boolean };

export type ReactionAction = "added" | "removed";

export type ReactEndpointResp = {
  ok: true;
  chatId: string;
  messageId: string;
  emoji: string;
  summary: ReactionSummary;
  action?: "added" | "removed"; // optional
};