import { ChatMessage} from "@shared/types/chatMessage";
import { VoiceAttachment } from "@shared/types/voiceAttachment";

export type ReplyTarget =
  Pick<ChatMessage, "id" | "senderId" | "type" | "text"> & {
    voice?: Pick<VoiceAttachment, "durationSec">;
  };