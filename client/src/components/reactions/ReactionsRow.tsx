import { ReactionSummary } from "@shared/types/reactionSummary";
import { ReactionPill } from "./ReactionPill";

export function ReactionsRow({ reactions }: { reactions?: ReactionSummary[] }) {
  const visible = (reactions ?? []).filter((reaction) => reaction.count > 0);
  if (visible.length === 0) return null;

  // Optional: stable ordering (emoji asc). Or keep server order.
  const sorted = [...visible].sort((a, b) => a.emoji.localeCompare(b.emoji));

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {sorted.map((reaction) => (
        <ReactionPill
          key={reaction.emoji}
          emoji={reaction.emoji}
          count={reaction.count}
          reactedByMe={reaction.reactedByMe}
        />
      ))}
    </div>
  );
}