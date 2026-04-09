import { ChatMessage } from "./chatMessage";

// shared/types/chatSummary.ts (or client/types/chat.ts)
export type ChatParticipant = {
  id: string;
  displayName: string;
  handle?: string | null;
  role: "MEMBER" | "ADMIN";
};



export type ChatSummary = {
  id: string;
  type: "DM" | "GROUP";
  name?: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string | null;
  lastMessage?: ChatMessage | null;
  participants: ChatParticipant[];
  me?: {
    role: "MEMBER" | "ADMIN";
    unreadCount: number;
  } | null;
};
