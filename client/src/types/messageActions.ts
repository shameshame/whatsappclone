import { ChatMessage } from "@shared/types/chatMessage";

export type MessageActions={
 onEdit: (id: string, nextText: string) => Promise<void>;
   onDelete: (id: string) => Promise<void>;
   onReact: (id: string, emoji: string) => Promise<void>;
   onReply: (message: ChatMessage) => void; 



}