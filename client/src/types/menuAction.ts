export type ActionsMenuProps = {
  isMe: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
  onReply?: () => void;
  onReact?: () => void;
  createdAt: string |Date;
  isHandheld: boolean;
  // optional: you might want to disable edit/delete if > 15 min
  canEdit?: boolean;
  canDelete?: boolean;
  className?: string;

  // alignment depends on bubble side
  align?: "start" | "end";
};
