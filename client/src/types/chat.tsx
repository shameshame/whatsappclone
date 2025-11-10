import type { Message } from "./message";

export type Chat = {
  peerId: string;
  name: string;
  messages: Message[];
};

export type ChatMessage = {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: string; // ISO
};