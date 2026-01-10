import { cn } from "@/lib/utils";
import { UnreadBadge } from "./UnreadBadge";


type ChatItemProps = {
  name: string;
  message?:string,
  unreadCount?:number
  
};


export default function ChatItem({
  name,
  message,
  unreadCount = 0,
}: ChatItemProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer">
      {/* Avatar */}
      <div className="w-10 h-10 bg-gray-300 rounded-full shrink-0" />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-left truncate",unreadCount > 0 ? "font-semibold" : "font-medium")}>{name}</p>
        <p className="text-left text-gray-500 text-xs truncate">
          {message}
        </p>
      </div>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <div className="ml-2">
          <UnreadBadge count={unreadCount} />
        </div>
      )}
    </div>
  );
}
