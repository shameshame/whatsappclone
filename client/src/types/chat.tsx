import type { Message } from "./message";

export type Chat = {
  id: string;
  name: string;
  messages: Message[];
};