import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import UnreadBadge from "./UnreadBadge";
import { ChatMessage } from "@shared/types/chatMessage";
import { getMessagePreview } from "@/utilities/getMessagePreview";

type ChatItemProps = {
  name: string;
  lastMessage?: ChatMessage | null;
  unreadCount?: number;
};



export default function ChatItem({
  name,
  lastMessage,
  unreadCount = 0,
}: ChatItemProps) {
  const preview = getMessagePreview(lastMessage);

  return (
    <div className="flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-gray-100">
      <div className="h-10 w-10 shrink-0 rounded-full bg-gray-300" />

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-left",
            unreadCount > 0 ? "font-semibold" : "font-medium"
          )}
        >
          {name}
        </p>

        <div className="flex items-center gap-1 text-left text-xs text-gray-500">
          {lastMessage?.type === "voice" && (
            <Mic className="h-3.5 w-3.5 shrink-0" />
          )}
          <p className="truncate">{preview}</p>
        </div>
      </div>

      {unreadCount > 0 && (
        <div className="ml-2">
          <UnreadBadge count={unreadCount} />
        </div>
      )}
    </div>
  );
}