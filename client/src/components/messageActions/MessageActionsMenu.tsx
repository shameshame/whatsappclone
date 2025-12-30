// MessageActionsMenu.tsx
import { useState } from "react";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ActionRow } from "./MessageActionRow";
import { useLongPress } from "../UseLongPress";
import { menuActions, canEditWindow, type ActionKey } from "./helpers";
import { EditMessageDialog } from "./EditMessageDialog";
import { ReactPicker } from "./ReactOnMessage";
import type { ActionsMenuProps } from "@/types/menuAction";

export function MessageActionsMenu({
  isMe,
  message,
  canDelete = false,
  canEdit = true,
  isHandheld,
  onReply,
  onEdit,
  onDelete,
  onReact,
  className,
  align = "end",
}: ActionsMenuProps) {
  const [open, setOpen] = useState(false);

  // dialogs state
  const [editOpen, setEditOpen] = useState(false);
  const [reactOpen, setReactOpen] = useState(false);

  const longPress = useLongPress({
    enabled: isHandheld,
    onLongPress: () => setOpen(true),
  });

  const openEdit = () => {
    if (!isMe) return;
    if (!canEdit) return;
    if (!canEditWindow(message.createdAt)) return;
    setOpen(false);
    setEditOpen(true);
  };

  const openReact = () => {
    setOpen(false);
    setReactOpen(true);
  };

  const doDelete = () => {
    if (!isMe || !canDelete) return;
    setOpen(false);
    onDelete(message.id);
  };

  const handleAction = (key: ActionKey) => {
    // close menu first
    setOpen(false);

    switch (key) {
      case "reply":
        onReply(message);
        return;
      case "react":
        openReact();
        return;
      case "edit":
        openEdit();
        return;
      case "delete":
        doDelete();
        return;
    }
  };

  const actions = menuActions({ message, isMe, canDelete, canEdit });

  // ✅ Render dialogs here (once), with full props
  const dialogs = (
    <>
      <ReactPicker
        open={reactOpen}
        onOpenChange={setReactOpen}
        isHandheld={isHandheld}
        onPick={(emoji) => onReact(message.id, emoji)}
      />

      <EditMessageDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        isHandheld={isHandheld}
        initialText={message.text}
        onSave={(nextText) => onEdit(message.id, nextText)}
      />
    </>
  );

  if (isHandheld) {
    return (
      <div className={cn("relative", className)} {...longPress}>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl p-0">
            <SheetHeader className="px-4 pt-4 pb-2">
              <SheetTitle className="text-base">Message</SheetTitle>
              <SheetDescription className="text-xs">Choose an action</SheetDescription>
            </SheetHeader>

            <div className="px-2 pb-3">
              {actions.map(({ key, label, icon: Icon, danger }) => (
                <ActionRow
                  key={key}
                  icon={<Icon className="h-4 w-4" />}
                  label={label}
                  onClick={() => handleAction(key)}
                  danger={danger}
                />
              ))}

              <div className="px-2 pt-2 pb-2">
                <Button type="button" variant="secondary" className="w-full h-11 rounded-xl" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {dialogs}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-white/70 hover:bg-white shadow-sm text-muted-foreground hover:text-foreground">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align={align} className="w-44" sideOffset={6}>
          {actions.map((a, idx) => (
            <div key={a.key}>
              {idx === 2 ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem
                onClick={() => handleAction(a.key)}
                className={a.danger ? "text-red-600 focus:text-red-600" : undefined}
              >
                <a.icon className="mr-2 h-4 w-4" />
                {a.label}
              </DropdownMenuItem>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {dialogs}
    </div>
  );
}
