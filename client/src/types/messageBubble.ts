import { ChatMessage } from "@shared/types/chatMessage";
import { MessageActions } from "./messageActions";

export type MessageBubbleProps = MessageActions & {
  message: ChatMessage;
  
  avatarUrl?: string;    
}