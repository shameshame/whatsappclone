// src/components/chat/MessageActions.tsx
import { MoreVertical, Trash2, Edit3, Reply, Smile, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { cn } from "@/lib/utils";
import React from "react";
import { ActionRow } from "./MessageActionRow";
import { useLongPress } from "../UseLongPress";
import { canEdit } from "./helpers";
import { ActionsMenuProps } from "@/types/menuAction";
import { menuActions } from "./helpers";





export function MessageActionsMenu({
  isMe,
  createdAt,
  canDelete = false,
  isHandheld,
  onReply,
  onEdit,
  onDelete,
  onReact,
  className,
  align = "end",
}: ActionsMenuProps) {
  const [open, setOpen] = React.useState(false);

  const longPress = useLongPress({
    enabled: isHandheld,
    onLongPress: () => setOpen(true),
  });

  
const actionsMenuProps = {isMe,createdAt, canDelete, onReply, onEdit, onDelete, onReact, isHandheld, className, align};


  // One handler: close first, then act
  const act = (fn?: () => void) => {
    setOpen(false);
    fn?.();
  };

  // MOBILE: Sheet (opened by long press)
  if (isHandheld) {
    return (
      <div className={cn("relative", className)} {...longPress}>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl p-0">
            <SheetHeader className="px-4 pt-4 pb-2">
              <SheetTitle className="text-base">Message</SheetTitle>
              <SheetDescription className="text-xs">
                Choose an action
              </SheetDescription>
            </SheetHeader>

            <div className="px-2 pb-3">
              {menuActions(actionsMenuProps).map(({ key, label, icon: Icon, onClick, danger }) => (
                <ActionRow
                  key={key}
                  icon={<Icon className="h-4 w-4" />}
                  label={label}
                  onClick={() => act(onClick)}
                  disabled={!onClick}
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
      </div>
    );
  }

  // DESKTOP: DropdownMenu (opened by click on ⋮)
  return (
    <div className={cn("relative", className)}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7 rounded-full",
              "bg-white/70 hover:bg-white",
              "shadow-sm",
              "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Message actions"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align={align} className="w-44" sideOffset={6}>
          <DropdownMenuItem onClick={() => act(onReply)} disabled={!onReply}>
            <Reply className="mr-2 h-4 w-4" />
            Reply
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => act(onReact)} disabled={!onReact}>
            <Smile className="mr-2 h-4 w-4" />
            React
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => act(onEdit)}
            disabled={!isMe || !canEdit || !onEdit}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => act(onDelete)}
            disabled={!isMe || !canDelete || !onDelete}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
