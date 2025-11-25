import { ChatMessage } from "@shared/types/chatMessage";

export type Chat = {
  peerId: string;
  name: string;
  messages: ChatMessage[];
  members: string[];
};

