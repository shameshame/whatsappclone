import { ChatMessage } from "@/types/chat";
import { VideoIcon, ChevronDown } from "lucide-react";
import { ChatMore } from "./ChatMore";
import { ChatSearch } from "./ChatSearch";

export function ChatTopMenu({messages}: {messages: ChatMessage[]}) {
  return (
   <div className="flex items-center gap-3">
          <div className="flex ">
            <VideoIcon/>
            <ChevronDown/>
          </div>
          <ChatSearch messages={messages}/>
          <ChatMore/>
    </div>
    
  )

}
