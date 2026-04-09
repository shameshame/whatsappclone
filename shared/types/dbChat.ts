export type DbChat = {
  id: string;
  type: "DM" | "GROUP";
  name: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  lastMessageAt: Date | string | null;
  members: Array<{
    role: "MEMBER" | "ADMIN";
    unreadCount: number;
    user: {
      id: string;
      displayName: string | null;
      handle: string | null;
    };
  }>;
  messages: Array<{
    id: string;
    chatId: string;
    text: string | null;
    type: "text" | "voice" | "image";
    createdAt: Date | string;
    isDeleted: boolean;
    editedAt?: Date | string | null;
    senderId: string;
    replyToId?: string | null;
    deletedAt?: Date | string | null;

    voiceUrl?: string | null;
    voiceMimeType?: string | null;
    voiceDurationSec?: number | null;

    author?: {
      id: string;
      displayName: string | null;
      handle: string | null;
    };
  }>;
};