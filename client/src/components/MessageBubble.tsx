import { cn } from "@/lib/utils";
import { MessageActionsMenu } from "./messageActions/MessageActionsMenu";
import { MessageBubbleProps } from "@/types/messageBubble";
import { useAuth } from "./context/AuthContext";
import { isLikelyHandheld } from "@/utilities/device";
import { useMemo, useState } from "react";
import { useLongPress } from "./UseLongPress";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MessageBubble({
  message,
  avatarUrl,
  onEdit,
  onDelete,
  onReact,
  onReply,
}: MessageBubbleProps) {
  const formatTime = (timestamp: number | string | Date) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const { user } = useAuth();
  const isMe = user?.id === message.senderId;

  const handheld = useMemo(
    () => (typeof window === "undefined" ? false : isLikelyHandheld()),
    []
  );

  const [menuOpen, setMenuOpen] = useState(false);

  // ✅ long press on the whole bubble (mobile only)
  const longPress = useLongPress({
    enabled: handheld,
    onLongPress: () => setMenuOpen(true),
  });

  return (
    <div className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
      {/* ✅ `group` is needed for group-hover */}
      <div
        className={cn(
          "group relative max-w-xs min-w-[50px] rounded-xl border px-4 py-2 text-sm",
          isMe ? "bg-green-500 text-white" : "bg-stone-50 text-foreground"
        )}
        {...(handheld ? longPress : {})} // ✅ spread handlers here
      >
        {/* ✅ Desktop: down-arrow trigger appears on hover */}
        {!handheld && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen(true)}
            className={cn(
              "absolute top-1 opacity-0 group-hover:opacity-100 transition",
              isMe ? "left-1" : "right-1",
              "h-7 w-7 rounded-full bg-white/70 hover:bg-white shadow-sm",
              "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Message actions"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        )}

        {/* message text */}
        <p className="px-2 break-words">{message.text}</p>

        {/* time */}
        <span className="absolute right-2 -bottom-4 text-[10px] text-gray-400">
          {formatTime(message.createdAt)}
        </span>

        {/* ✅ Menu is controlled by MessageBubble state */}
        <div
          className={cn(
            "absolute top-1",
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
            canEdit={isMe}
            isHandheld={handheld}
            align={isMe ? "start" : "end"}
          />
        </div>
      </div>
    </div>
  );
}
