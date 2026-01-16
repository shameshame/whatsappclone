import { useState,useCallback, useRef} from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar,AvatarImage} from "@/components/ui/avatar"
import { Send} from "lucide-react"
import MessageBubble from "./MessageBubble"
import { useParams } from "react-router"
import { useChat } from "../custom-hooks/UseChat"
import { ChatMessage } from "@shared/types/chatMessage";
import {ChatTopMenu} from "./ChatTopMenu";
import { useNearBottom } from "../custom-hooks/useNearBottom"


export default function ChatWindow() {
    const [input, setInput] = useState("")
    const windowRef = useRef<HTMLDivElement | null>(null);
    const { chatId } = useParams<{ chatId: string }>();
    const { messages, loading, sendMessage,deleteMessage,updateMessage,reactToMessage,setReplyTo,markAsRead} = useChat(chatId);
  


    // ✅ auto-mark read when near bottom (debounced)
  useNearBottom(windowRef, {
    thresholdPx: 32,
    debounceMs: 350,
    enabled: !!chatId,
    onNearBottom: markAsRead,
  });

    // ✅ onEdit: called from MessageBubble → opens Edit UI → Save calls this
  const onEdit = useCallback(
    async (messageId: string, nextText: string) => {
      await updateMessage(messageId, nextText);
    },
    [updateMessage]
  );

  // ✅ onDelete: called from MessageBubble → Delete option
  const onDelete = useCallback(
    async (messageId: string) => {
      await deleteMessage(messageId);
    },
    [deleteMessage]
  );

  // ✅ onReact: called from MessageBubble → emoji pick
  const onReact = useCallback(
    async (messageId: string, emoji: string) => {
      await reactToMessage(messageId, emoji);
    },
    [reactToMessage]
  );

  // (optional) reply
  const onReply = useCallback(
    (message: ChatMessage) => {
      setReplyTo?.({ id: message.id, text: message.text, senderId: message.senderId });
    },
    [setReplyTo]
  );

  const onSendMessage = useCallback(async () => {
      const text = input.trim();
      
      if (!text.trim()) return;
      setInput("");

      try {
        await sendMessage(text);
      } catch (error) {
        console.error("Failed to send message:", error);
      }   
    }, [sendMessage,input]);
    
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
      <div ref={windowRef} className="overflow-y-auto p-4 space-y-8  h-screen">
        {loading ? <div>Loading…</div> : null}
        {messages.map((message: ChatMessage) => 
              <MessageBubble
                key={message.id}
                message={message}
                onEdit={onEdit}
                onDelete={onDelete}
                onReact={onReact}
                onReply={onReply}
              />
            
        )}
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






