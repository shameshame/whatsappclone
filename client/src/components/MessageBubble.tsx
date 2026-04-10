import { cn } from "@/lib/utils";
import { MessageActionsMenu } from "./messageActions/MessageActionsMenu";
import { MessageBubbleProps } from "@/types/messageBubble";
import { useAuth } from "./context/AuthContext";
import { isLikelyHandheld } from "@/utilities/device";
import { useMemo, useState,memo } from "react";
import { useLongPress } from "../custom-hooks/UseLongPress";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReactionsRow } from "./reactions/ReactionsRow";
import { formatTime } from "@shared/utils/formatTime";

import  MessageContent  from "./MessageContent";

function MessageBubble({
  message,
  avatarUrl,
  onEdit,
  onDelete,
  onReact,
  onReply,
}: MessageBubbleProps) {
  const { user } = useAuth();
  const isMe = user?.id === message.senderId;

  const handheld = useMemo(
    () => (typeof window === "undefined" ? false : isLikelyHandheld()),
    []
  );

  const [menuOpen, setMenuOpen] = useState(false);

  const longPress = useLongPress({
    enabled: handheld,
    onLongPress: () => setMenuOpen(true),
  });

  


  

  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isMe ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "group relative max-w-xs min-w-[50px] rounded-xl border px-4 py-2 text-sm shadow-sm",
          isMe ? "bg-green-500 text-white" : "bg-stone-50 text-foreground"
        )}
        {...(handheld ? longPress : {})}
      >
        {!handheld && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen(true)}
            className={cn(
              "absolute top-1 z-10 opacity-0 transition group-hover:opacity-100",
              isMe ? "left-1" : "right-1",
              "h-7 w-7 rounded-full bg-white/70 shadow-sm hover:bg-white",
              "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Message actions"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        )}

        <div className="pr-6">
          <MessageContent message={message} isMe={isMe} />
        </div>

        <div className="mt-2 px-2">
          <ReactionsRow reactions={message.reactions ?? []} />
        </div>

        <span
          className={cn(
            "mt-2 block px-2 text-[10px]",
            isMe ? "text-white/70" : "text-gray-400"
          )}
        >
          {formatTime(message.createdAt)}
        </span>

        <div
          className={cn(
            "absolute top-1 z-20",
            isMe ? "left-1" : "right-1",
            handheld ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          <MessageActionsMenu
            open={menuOpen}
            onOpenChange={setMenuOpen}
            message={message}
            onEdit={onEdit}
            onDelete={onDelete}
            onReact={onReact}
            onReply={onReply}
            isMe={isMe}
            canDelete={isMe}
            canEdit={isMe && message.type === "text" && !message.isDeleted}
            isHandheld={handheld}
            align={isMe ? "start" : "end"}
          />
        </div>
      </div>
    </div>
  );
}


export default memo(
  MessageBubble,
  (prev, next) =>
    prev.message === next.message &&
    prev.avatarUrl === next.avatarUrl &&
    prev.onEdit === next.onEdit &&
    prev.onDelete === next.onDelete &&
    prev.onReact === next.onReact &&
    prev.onReply === next.onReply
);