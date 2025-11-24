import { useEffect, useRef, useState,useCallback } from "react"
import type { User } from "@/types/user"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar,AvatarImage} from "@/components/ui/avatar"
import { ChatSearch } from "./ChatSearch";
import { Send,VideoIcon,ChevronDown,MoreVertical  } from "lucide-react"
import MessageBubble from "./MessageBubble"
import { ChatMore } from "./ChatMore"
import { useParams } from "react-router"
import { useDirectChat } from "./UseDirectChat"
import { ChatMessage } from "@shared/types/chatMessage";
import {ChatTopMenu} from "./ChatTopMenu";
import { on } from "events"
import { useAuth } from "./context/AuthContext"


export default function ChatWindow() {
    const [input, setInput] = useState("")
    const { peerId } = useParams<{ peerId: string }>();
    const {user}=useAuth();
    const { messages, loading, sendMessage,deleteMessageOnServer } = useDirectChat(peerId as string);
    const currentUser = user?.id





    const onSendMessage = useCallback(async () => {
      const text = input.trim();
      
      if (!text.trim()) return;
      setInput("");

      try {
        await sendMessage(text);
      } catch (error) {
        console.error("Failed to send message:", error);
      }   
    }, [sendMessage,peerId,input]);
    
  return (
    <div className="flex-1 bg-[#f7f1ea] flex flex-col  h-screen">
      <div className="flex justify-between items-center bg-white p-4 shadow-sm ">
        <div className="flex items-center gap-3 px-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src="https://i.pravatar.cc/150?u=alice" className="w-full h-full object-cover"/>
          </Avatar>
          <span className="text-lg font-medium">Alice</span>
         <ChatTopMenu messages={messages}/>
      </div>
      </div>
      
      {/* Messages */}
      <div className="overflow-y-auto p-4 space-y-8  h-screen">
        {loading ? <div>Loading…</div> : null}
        {messages.map((message: ChatMessage) => {
            const isMe = message.senderId === currentUser;
            

            return (
              <MessageBubble
                key={message.id}
                text={message.text}
                timestamp={Date.parse(message.createdAt)}
                isMe={isMe}
              />
            );
        })}
      </div>
      
      {/* Input */}
      <div className="sticky bottom-0 border-t p-2 flex items-center gap-2">
        <Input
          placeholder="Type a message"
          className="bg-white"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={async (event) => {
            if (event.key === "Enter") onSendMessage();
          }
         }
        />
        <Button size="icon" onClick={onSendMessage} disabled={!input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}






