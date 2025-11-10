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
import { ChatMessage } from "@/types/chat";
import {ChatTopMenu} from "./ChatTopMenu";


const users = [
  {
    id: "userA",
    name: "Alice",
    avatar: "https://i.pravatar.cc/150?u=alice"
  },
  {
    id: "userB",
    name: "Bob",
    avatar: "https://i.pravatar.cc/150?u=bob"
  }
];

const userMap = new Map<string,User>(users.map((user) => [user.id, user]))


export default function ChatWindow() {
    const [input, setInput] = useState("")
    const { peerId } = useParams<{ peerId: string }>();
    
    const { messages, loading, sendMessage } = useDirectChat(peerId as string);
    const currentUser = userMap.get("userA"); // assuming userA is the current user
    // const ChatTopMenuComp = ChatTopMenu as unknown;

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
            const isMe = message.senderId === currentUser?.id;
            const sender = userMap.get(message.senderId)

            return (
              <MessageBubble
                key={message.id}
                text={message.text}
                timestamp={Date.parse(message.createdAt)}
                isMe={isMe}
                avatarUrl={sender?.avatar}
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
            if (event.key === "Enter") {
              const text = input;
              setInput("");
              try { await sendMessage(text); } catch (e) { console.error(e); }
            }
          }}
        />
        <Button size="icon" onClick={async () => {
          const text = input.trim();
          if (!text) return;
          setInput("");
          try { await sendMessage(text); } catch (e) { console.error(e); }
        }}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}






