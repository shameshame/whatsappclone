import { cn } from "@/lib/utils";
import { ReactionSummary } from "../../types/reaction";

export function ReactionPill({
  emoji,
  count,
  reactedByMe,
}: ReactionSummary) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
        "bg-white/80",
        reactedByMe ? "border-emerald-500" : "border-muted-foreground/20"
      )}
    >
      <span className="leading-none">{emoji}</span>
      <span className="tabular-nums text-foreground/80">{count}</span>
    </span>
  );
}

