import { cn } from "@/lib/utils";
import { MessageBubbleProps } from "@/types/messageBubble";
import { memo } from "react";
import { Play } from "lucide-react";

function MessageContent({
  message,
  isMe,
}: {
  message: MessageBubbleProps["message"];
  isMe: boolean;
}) {

  if (!message) {
    return <p className="px-2 italic">Invalid message</p>;
  }

  

  
  
  const kind = message.type ?? "text";

  
  
  
  if (kind === "voice" && message.voice) {
    if (!message.voice?.url) {
      return (
        <p className={cn("px-2 italic", isMe ? "text-white/80" : "text-muted-foreground")}>
          Voice message unavailable
        </p>
      );
    }
    
    
    
    return (
      <div className="px-2">
        <div className="mb-2 flex items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              isMe ? "bg-white/20" : "bg-muted"
            )}
          >
            <Play className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <audio controls preload="metadata" className="max-w-full">
              <source
                src={message.voice.url}
                type={message.voice.mimeType || "audio/webm"}
              />
              Your browser does not support audio playback.
            </audio>
          </div>
        </div>

        <div
          className={cn(
            "text-xs",
            isMe ? "text-white/80" : "text-muted-foreground"
          )}
        >
          Voice message
          {typeof message.voice.durationSec === "number" && ` • ${message.voice.durationSec}s` }
           
        </div>
      </div>
    );
  }
  return <p className="px-2 break-words whitespace-pre-wrap">{message.text}</p>;
}


export default memo(MessageContent);