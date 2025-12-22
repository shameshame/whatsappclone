import { ActionsMenuProps } from "@/types/menuAction";
import { Reply, Edit3, Smile, Trash2 } from "lucide-react";




export function canEdit(createdAt: string | Date): boolean {
  const EDIT_WINDOW_MS = 15 * 60 * 1000;
  
  const ts = typeof createdAt === "string"
    ? Date.parse(createdAt)
    : createdAt.getTime();

  if (Number.isNaN(ts)) return false;
  return Date.now() - ts <= EDIT_WINDOW_MS;
}





export function menuActions(props:ActionsMenuProps){

const{ isMe, createdAt, canDelete = false, onReply, onEdit, onDelete, onReact } = props;

  const actions = [
    !isMe && { key: "reply", label: "Reply", icon: Reply, onClick: onReply },
    isMe && canEdit(createdAt) && { key: "edit", label: "Edit", icon: Edit3, onClick: onEdit },
    { key: "react", label: "React", icon: Smile, onClick: onReact },
    isMe &&
      canDelete && {
        key: "delete",
        label: "Delete",
        icon: Trash2,
        onClick: onDelete,
        danger: true,
      },
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    icon: React.ElementType;
    onClick?: () => void;
    danger?: boolean;
  }>;
    return actions;


}