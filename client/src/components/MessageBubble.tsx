import { cn } from "@/lib/utils";

import { MessageActionsMenu } from "./messageActions/MessageActionsMenu";
import { MessageBubbleProps } from "@/types/messageBubble";
import { useAuth } from "./context/AuthContext";
import { isLikelyHandheld } from "@/utilities/device";
import { useMemo} from "react";



export default function MessageBubble({message,avatarUrl, onEdit, onDelete, onReact, onReply }: MessageBubbleProps) {
  const formatTime = (timestamp: number|string|Date) =>new Date(timestamp).toLocaleTimeString([], {day:"2-digit",month:"2-digit",year:"2-digit", hour: "2-digit", minute: "2-digit" });
  const {user}=useAuth();
  const isMe = user?.id === message.senderId;
 
  const handheld = useMemo(() => (typeof window === "undefined" ? false : isLikelyHandheld()), []);
  
  
  
  
  return (
    <div className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
      

      <div className={cn("relative px-4 py-2 rounded-xl text-sm max-w-xs min-w-[50px]",  isMe ?"bg-green-500" : "bg-stone-50", "border ml-auto")}>
        
        {/* Action button (appears on hover) */}
        <div
          className={cn(
            "absolute top-1",
            isMe ? "left-1" : "right-1",
            "opacity-0 group-hover:opacity-100 transition"
          )}
        >
          <MessageActionsMenu
            message={message}
            onEdit={onEdit}
            onDelete={onDelete}
            onReact={onReact}
            onReply={onReply}
            isMe={isMe}
            canDelete={isMe}
            canEdit={isMe}
            isHandheld={handheld}
          />


         
        </div>
       <p className="px-4">{message.text}</p>

       


        <span className="absolute text-[10px] right-2 bottom-[-14px] text-gray-400">{formatTime(message.createdAt)}</span>
      </div>

      
    </div>
  );
}