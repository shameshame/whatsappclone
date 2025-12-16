import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@radix-ui/react-dropdown-menu";
import { MoreVertical, Reply, Edit3, Smile, Trash2 } from "lucide-react";
import { Button } from "./ui/button";

type Props = {
  text: string;
  timestamp: number;
  isMe: boolean;
  avatarUrl?: string;
};

export default function MessageBubble({ text, timestamp, isMe, avatarUrl }: Props) {
  const formatTime = (timestamp: number) =>new Date(timestamp).toLocaleTimeString([], {day:"2-digit",month:"2-digit",year:"2-digit", hour: "2-digit", minute: "2-digit" });

  const onReply = () => {
    console.log("Reply to message:", text);
  };

  const onEdit = () => {
    console.log("Edit message:", text);
  };    
  const onReact = () => {
    console.log("React to message:", text);
  }
  const onDelete = () => {
    console.log("Delete message:", text);
  }
  
  
  
  
  
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 rounded-full"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align={isMe ? "start" : "end"}>
              {!isMe && (
                <DropdownMenuItem onClick={onReply}>
                  <Reply className="mr-2 h-4 w-4" />
                  Reply
                </DropdownMenuItem>
              )}

              {isMe && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}

              <DropdownMenuItem onClick={onReact}>
                <Smile className="mr-2 h-4 w-4" />
                React
              </DropdownMenuItem>

              {isMe && (
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        
        
        
        
        
        <p className="px-4">{text}</p>
        <span className="absolute text-[10px] right-2 bottom-[-14px] text-gray-400">{formatTime(timestamp)}</span>
      </div>

      
    </div>
  );
}