// src/components/chat/MessageActions.tsx
import { MoreVertical, Trash2, Edit3, Reply, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "usehooks-ts";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";

type Props = {
  isMe: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
  onReply?: () => void;
  onReact?: () => void;
  createdAt: string |Date;

  // optional: you might want to disable edit/delete if > 15 min
  canEdit?: boolean;
  canDelete?: boolean;

  // alignment depends on bubble side
  align?: "start" | "end";
};

export function MessageActions({
  isMe,
  onDelete,
  onEdit,
  onReply,
  onReact,
  createdAt,
  canDelete = true,
  align = "end",
}: Props) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [open, setOpen] = useState(false);

 const EDIT_WINDOW_MS = 15 * 60 * 1000;

function canEdit(createdAt: string | Date): boolean {
  const ts = typeof createdAt === "string"
    ? Date.parse(createdAt)
    : createdAt.getTime();

  if (Number.isNaN(ts)) return false;
  return Date.now() - ts <= EDIT_WINDOW_MS;
}

  const items = [
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

  const Trigger = (
    <Button
      size="icon"
      variant="ghost"
      className="h-7 w-7 rounded-full"
      onClick={() => setOpen(true)}
      aria-label="Message actions"
      type="button"
    >
      <MoreVertical className="h-4 w-4" />
    </Button>
  );

  if (isMobile) {
    return (
      <>
        {Trigger}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="p-0">
            <SheetHeader className="px-4 py-3">
              <SheetTitle>Message</SheetTitle>
            </SheetHeader>

            <div className="px-2 pb-2">
              {items.map((it) => {
                const Icon = it.icon;
                return (
                  <button
                    key={it.key}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      it.onClick?.();
                    }}
                    className={[
                      "w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left",
                      "active:bg-muted transition",
                      it.danger ? "text-red-600" : "",
                    ].join(" ")}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-base">{it.label}</span>
                  </button>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop: dropdown
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{Trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <DropdownMenuItem
              key={it.key}
              onSelect={() => {
                setOpen(false);
                it.onClick?.();
              }}
              className={it.danger ? "text-red-600 focus:text-red-600" : ""}
            >
              <Icon className="mr-2 h-4 w-4" />
              {it.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
