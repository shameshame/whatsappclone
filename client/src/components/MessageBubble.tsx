import { cn } from "@/lib/utils";

type Props = {
  text: string;
  timestamp: number;
  isMe: boolean;
  avatarUrl?: string;
};

export default function MessageBubble({ text, timestamp, isMe, avatarUrl }: Props) {
  const formatTime = (timestamp: number) =>new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
      

      <div className={cn("relative px-4 py-2 rounded-xl text-sm max-w-xs min-w-[50px]",  isMe ?"bg-green-500" : "bg-stone-50", "border ml-auto")}>
        <p className="px-4">{text}</p>
        <span className="absolute text-[10px] right-2 bottom-[-14px] text-gray-400">{formatTime(timestamp)}</span>
      </div>

      
    </div>
  );
}