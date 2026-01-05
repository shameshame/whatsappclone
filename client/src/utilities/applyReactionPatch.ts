import { ChatMessage } from "@shared/types/chatMessage";
import { ReactionSummary } from "@shared/types/reactionSummary";



export function applyReactionPatch(
  prev: ChatMessage[],
  patch: {
    messageId: string;
    emoji: string;
    summary?: ReactionSummary; // if missing or count<=0 => remove
  }
): ChatMessage[] {
  const nextSummary = patch.summary;
  const shouldRemove = !nextSummary || nextSummary.count <= 0;

  return prev.map((message) => {
    if (message.id !== patch.messageId) return message;

    const current = message.reactions ?? [];
    const exists = current.some((reaction) => reaction.emoji === patch.emoji);

    if (shouldRemove) {
      if (!exists) return message;
      return { ...message, reactions: current.filter((reaction) => reaction.emoji !== patch.emoji) };
    }

    // upsert reaction
    const next = exists
      ? current.map((reaction) => (reaction.emoji === patch.emoji ? nextSummary : reaction))
      : [...current, nextSummary];

    return { ...message, reactions: next };
  });
}
