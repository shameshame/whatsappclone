// shared/types/chatSummary.ts (or client/types/chat.ts)
export type ChatParticipant = {
  id: string;
  displayName: string;
  handle?: string | null;
  role: "MEMBER" | "ADMIN";
};

export type ChatLastMessage = {
  id: string;
  text: string | null;
  kind: string;
  createdAt: string;
  editedAt?: string | null;
  isDeleted: boolean;
  sender: {
    id: string;
    displayName: string;
    handle?: string | null;
  };
};

export type ChatSummary = {
  id: string;
  type: "DM" | "GROUP";
  name?: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string | null;
  lastMessage?: ChatLastMessage | null;
  participants: ChatParticipant[];
  me?: {
    role: "MEMBER" | "ADMIN";
    unreadCount: number;
  } | null;
};
