// helpers.ts
import { Reply, Edit3, Smile, Trash2 } from "lucide-react";
import type { ChatMessage } from "@shared/types/chatMessage";

export type ActionKey = "reply" | "react" | "edit" | "delete";

export type MenuAction = {
  key: ActionKey;
  label: string;
  icon: React.ElementType;
  danger?: boolean;
  disabled?: boolean;
};

export function canEditWindow(createdAt: string | number | Date): boolean {
  const ts =
    createdAt instanceof Date
      ? createdAt.getTime()
      : typeof createdAt === "number"
        ? createdAt
        : Date.parse(createdAt);

  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts <= 15 * 60 * 1000;
}

export function menuActions(args: {
  message: ChatMessage;
  isMe: boolean;
  canDelete?: boolean;
  canEdit?: boolean;
}): MenuAction[] {
  const { message, isMe, canDelete = true, canEdit = true } = args;

  const editable = isMe && canEdit && canEditWindow(message.createdAt);
  const deletable = isMe && canDelete;

  return [
    { key: "reply", label: "Reply", icon: Reply },
    { key: "react", label: "React", icon: Smile },
    editable ? { key: "edit", label: "Edit", icon: Edit3 } : null,
    deletable ? { key: "delete", label: "Delete", icon: Trash2, danger: true } : null,
  ].filter(Boolean) as MenuAction[];
}
