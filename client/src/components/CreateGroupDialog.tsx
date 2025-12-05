// components/CreateGroupDialog.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Check, X, Users } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { httpErrorFromResponse } from "@/utilities/error-utils";
import { ChatSummary } from "@shared/types/chatSummary";
import { useChats } from "./context/ChatListContext";

type UserLite = { id: string; displayName: string; handle?: string | null };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: UserLite[];
};



export function CreateGroupDialog({ open, onOpenChange, users }: Props) {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { addOrUpdateChat } = useChats();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length >= 2 && selectedIds.length >= 1 && !submitting;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      u.displayName.toLowerCase().includes(q) ||
      (u.handle ?? "").toLowerCase().includes(q)
    );
  }, [users, query]);

  const selectedUsers = useMemo(
    () => users.filter((u) => selectedIds.includes(u.id)),
    [users, selectedIds]
  );

  const initialsFor = (u: UserLite) =>
    (
      u.displayName?.match(/\b\p{L}/gu)?.slice(0, 2).join("") ||
      u.displayName?.slice(0, 2) ||
      "?"
    ).toUpperCase();

  function toggleUser(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleCreateGroup() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/group/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          memberIds: selectedIds, // server adds current user itself
        }),
      });
      if (!res.ok) throw await httpErrorFromResponse(res);

      const data = (await res.json()) as {ok: boolean; chat: ChatSummary};
      addOrUpdateChat(data.chat);
      if (!data.chat?.id) throw new Error("Missing chat id");

      onOpenChange(false);
      setName("");
      setQuery("");
      setSelectedIds([]);

      navigate(`/chat/${data.chat.id}`);
    } catch (err: any) {
      setError(err?.message ?? "Failed to create group");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose(open: boolean) {
    if (!open) {
      // Optional: reset on close
      setError(null);
      setQuery("");
      // leave selection & name so user can reopen and continue
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Users className="h-4 w-4 text-emerald-500" />
            New group
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Choose participants and give your group a name.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pt-4 pb-3 space-y-3">
          {/* Selected participants row */}
          <div className="min-h-[48px] border rounded-xl px-3 py-2 bg-muted/40 flex flex-wrap gap-2 items-center">
            {selectedUsers.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                No participants yet. Tap contacts below to add.
              </span>
            ) : (
              selectedUsers.map((user) => (
                <div
                  key={user.id}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-100 px-2 py-1"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-[10px]">
                      {initialsFor(user)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium max-w-[120px] truncate">
                    {user.displayName}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleUser(user.id)}
                    className="inline-flex items-center justify-center rounded-full hover:bg-emerald-100 p-0.5"
                    aria-label={`Remove ${user.displayName}`}
                  >
                    <X className="h-3 w-3 text-emerald-600" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Group name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Group subject
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Family, Project Alpha, Friends"
              maxLength={60}
              className="h-9 text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              This will be visible to all participants.
            </p>
          </div>

          {/* Search field inside dialog */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Add participants
            </label>
            <div className="relative">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search contacts…"
                className="pl-8 h-9 text-sm"
              />
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground/70">
                🔍
              </span>
            </div>
          </div>
        </div>

        {/* List of contacts */}
        <ScrollArea className="max-h-[260px] border-t border-b">
          <ul className="py-1">
            {filtered.length === 0 ? (
              <li className="py-6 text-center text-xs text-muted-foreground">
                No contacts found
              </li>
            ) : (
              filtered.map((u) => {
                const selected = selectedIds.includes(u.id);
                return (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => toggleUser(u.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-5 py-2.5 text-left transition",
                        "hover:bg-muted/60",
                        selected && "bg-emerald-50/80"
                      )}
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-muted text-foreground/80 text-xs">
                          {initialsFor(u)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">
                          {u.displayName}
                        </div>
                        {u.handle && (
                          <div className="text-[11px] text-muted-foreground truncate">
                            @{u.handle}
                          </div>
                        )}
                      </div>
                      {selected && (
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </ScrollArea>

        {/* Footer buttons */}
        <div className="flex items-center justify-between px-6 py-3 bg-background">
          {error ? (
            <span className="text-xs text-red-500 truncate max-w-[60%]">
              {error}
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground">
              Select at least one participant and a subject.
            </span>
          )}

          <Button
            size="sm"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            disabled={!canSubmit}
            onClick={handleCreateGroup}
          >
            {submitting ? (
              <>
                <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Creating…
              </>
            ) : (
              <>
                Create group
                {/* you could add an ArrowRight icon if you want */}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
