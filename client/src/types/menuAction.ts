import { ChatMessage } from "@shared/types/chatMessage";
import { MessageActions } from "./messageActions";

export type ActionsMenuProps = MessageActions & {
  
  message:ChatMessage
  isMe: boolean;
  open: boolean;
  onOpenChange?: (value: boolean) => void;
  
  isHandheld: boolean;
  // optional: you might want to disable edit/delete if > 15 min
  canEdit?: boolean;
  canDelete?: boolean;
  className?: string;

  // alignment depends on bubble side
  align?: "start" | "end";
};
