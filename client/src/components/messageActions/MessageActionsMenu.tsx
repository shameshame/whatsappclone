import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ActionRow } from "./MessageActionRow";
import { menuActions, canEditWindow, type ActionKey } from "./helpers";
import { EditMessageDialog } from "./EditMessageDialog";
import { ReactPicker } from "./ReactOnMessage";
import type { ActionsMenuProps } from "@/types/menuAction";

export function MessageActionsMenu(props: ActionsMenuProps) {
  const {
    isMe,
    message,
    canDelete = false,
    canEdit = true,
    isHandheld,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    onReply,
    onEdit,
    onDelete,
    onReact,
    className,
    align = "end",
  } = props;

  // ✅ fallback state if component is used uncontrolled
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  // ✅ unified open state + setter
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = controlledOnOpenChange ?? setUncontrolledOpen;

  // dialogs state
  const [editOpen, setEditOpen] = useState(false);
  const [reactOpen, setReactOpen] = useState(false);

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

  const actions = useMemo(
    () => menuActions({ message, isMe, canDelete, canEdit }),
    [message, isMe, canDelete, canEdit]
  );

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

  // ✅ MOBILE
  if (isHandheld) {
    return (
      <div className={cn("relative", className)}>
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
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full h-11 rounded-xl"
                  onClick={() => setOpen(false)}
                >
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

  // ✅ DESKTOP
  return (
    <div className={cn("relative", className)}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full bg-white/70 hover:bg-white shadow-sm text-muted-foreground hover:text-foreground"
            aria-label="Message actions"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align={align} className="w-44" sideOffset={6}>
          {actions.map((action) => (
            <div key={action.key}>
              {action.key === "edit" && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={() => handleAction(action.key)}
                className={action.danger ? "text-red-600 focus:text-red-600" : undefined}
              >
                <action.icon className="mr-2 h-4 w-4" />
                {action.label}
              </DropdownMenuItem>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {dialogs}
    </div>
  );
}
