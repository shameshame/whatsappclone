import { cn } from "@/lib/utils";
import { MessageBubbleProps } from "@/types/messageBubble";
import { memo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";


export function MessageContent({
  message,
  isMe,
}: {
  message: MessageBubbleProps["message"];
  isMe: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  if (!message) {
    return <p className="px-2 italic">Invalid message</p>;
  }

  const kind = message.type ?? "text";

  if (message.isDeleted) {
    return (
      <p className={cn("px-2 italic", isMe ? "text-white/80" : "text-muted-foreground")}>
        Message deleted
      </p>
    );
  }

  if (kind === "voice") {
    if (!message.voice?.url) {
      return (
        <p className={cn("px-2 italic", isMe ? "text-white/80" : "text-muted-foreground")}>
          Voice message unavailable
        </p>
      );
    }

    async function togglePlayback() {
      const audio = audioRef.current;
      if (!audio) return;

      try {
        if (audio.paused) {
          await audio.play();
          setIsPlaying(true);
        } else {
          audio.pause();
          setIsPlaying(false);
        }
      } catch (error) {
        console.error("Audio playback failed:", error);
        setAudioError("Failed to play voice message");
      }
    }

    return (
      <div className="px-2">
        <div className="mb-2 flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlayback}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              isMe ? "bg-white/20" : "bg-muted"
            )}
            aria-label={isPlaying ? "Pause voice message" : "Play voice message"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <audio
              ref={audioRef}
              preload="metadata"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            >
              <source
                src={message.voice.url}
                type={message.voice.mimeType || "audio/webm"}
              />
              Your browser does not support audio playback.
            </audio>

            <div
              className={cn(
                "text-xs",
                isMe ? "text-white/80" : "text-muted-foreground"
              )}
            >
              Voice message
              {typeof message.voice.durationSec === "number"
                ? ` • ${message.voice.durationSec}s`
                : ""}
              </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <p className="px-2 break-words whitespace-pre-wrap">
      {message.text ?? ""}
    </p>
  );
}


export default memo(MessageContent);