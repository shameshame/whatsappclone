export type DbLastMessage = {
  id: string;
  chatId: string;
  text: string | null;
  type: "text" | "voice" | "image"
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
};