import { ChatMessage } from "@shared/types/chatMessage";

export function getMessagePreview(message?: ChatMessage | null): string {
  if (!message) return "";

  if (message.isDeleted) return "Message deleted";

  switch (message.type) {
    case "voice":
      return message.voice?.durationSec
        ? `Voice message • ${message.voice.durationSec}s`
        : "Voice message";

    case "text":
    default:
      return message.text ?? "";
  }
}