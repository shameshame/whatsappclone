import { ChatMessage } from "@shared/types/chatMessage";
import { VideoIcon, ChevronDown } from "lucide-react";
import { ChatMore } from "./ChatMore";
import { ChatSearch } from "./ChatSearch";
import { memo } from "react";

export  const ChatTopMenu= memo(function ChatTopMenu({
  messages,
}: {
  messages: ChatMessage[];
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex">
        <VideoIcon />
        <ChevronDown />
      </div>
      <ChatSearch messages={messages} />
      <ChatMore />
    </div>
  );
});
